import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';

/**
 * Local Storage Bridge Plugin:
 * Cho phép Web App ghi và đọc trực tiếp file JSON tại bất kỳ đường dẫn ổ đĩa nào của Windows
 * (ví dụ: E:\CSDL (CAM XOA)\du_lieu_du_an.json hoặc D:\Google Drive\ProjectM\du_lieu_du_an.json).
 * Vượt qua 100% rào cản Sandbox của trình duyệt, không bao giờ bị mất dữ liệu khi xóa cache!
 */
function localStorageBridgePlugin(): Plugin {
  return {
    name: 'local-storage-bridge',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 1. API Ghi trực tiếp vào file trên ổ cứng máy tính
        if (req.url === '/api/storage/write' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { filePath, data } = JSON.parse(body);
              if (!filePath) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Thiếu đường dẫn file (filePath).' }));
                return;
              }

              // Chuẩn hóa đường dẫn Windows
              const resolvedPath = path.resolve(filePath);
              const dir = path.dirname(resolvedPath);

              // Tự động tạo thư mục nếu chưa tồn tại
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }

              // Ghi an toàn bằng Atomic Write: ghi vào file tạm rồi đổi tên đè lên
              const tempPath = `${resolvedPath}.tmp`;
              const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
              fs.writeFileSync(tempPath, jsonStr, 'utf-8');
              fs.renameSync(tempPath, resolvedPath);

              const stats = fs.statSync(resolvedPath);
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  message: `Đã ghi thành công vào file: ${resolvedPath}`,
                  filePath: resolvedPath,
                  sizeBytes: stats.size,
                  modifiedAt: stats.mtime.toISOString(),
                })
              );
            } catch (err: any) {
              console.error('[Storage Bridge Error]', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  message: `Lỗi ghi file vào ổ cứng: ${err?.message || 'Lỗi không xác định'}`,
                })
              );
            }
          });
          return;
        }

        // 2. API Đọc trực tiếp từ file trên ổ cứng máy tính
        if (req.url === '/api/storage/read' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { filePath } = JSON.parse(body);
              if (!filePath) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Thiếu đường dẫn file (filePath).' }));
                return;
              }

              const resolvedPath = path.resolve(filePath);
              if (!fs.existsSync(resolvedPath)) {
                res.statusCode = 404;
                res.end(JSON.stringify({ success: false, message: `File không tồn tại: ${resolvedPath}` }));
                return;
              }

              const content = fs.readFileSync(resolvedPath, 'utf-8');
              const parsed = JSON.parse(content);
              const stats = fs.statSync(resolvedPath);

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  data: parsed,
                  filePath: resolvedPath,
                  sizeBytes: stats.size,
                  modifiedAt: stats.mtime.toISOString(),
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  message: `Lỗi đọc file từ ổ cứng: ${err?.message || 'Lỗi không xác định'}`,
                })
              );
            }
          });
          return;
        }

        // 3. API Kiểm tra trạng thái file trên ổ cứng
        if (req.url === '/api/storage/check' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { filePath } = JSON.parse(body);
              if (!filePath) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Thiếu đường dẫn file.' }));
                return;
              }

              const resolvedPath = path.resolve(filePath);
              const exists = fs.existsSync(resolvedPath);
              let size = 0;
              let mtime = '';

              if (exists) {
                const stats = fs.statSync(resolvedPath);
                size = stats.size;
                mtime = stats.mtime.toISOString();
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  exists,
                  filePath: resolvedPath,
                  sizeBytes: size,
                  modifiedAt: mtime,
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err?.message }));
            }
          });
          return;
        }

        // 4. API Lấy thông tin mạng nội bộ (LAN IP) để kết nối điện thoại di động
        if (req.url === '/api/network/info') {
          try {
            const interfaces = os.networkInterfaces();
            const ips: string[] = [];
            for (const devName of Object.keys(interfaces)) {
              for (const iface of interfaces[devName] || []) {
                if (iface.family === 'IPv4' && !iface.internal) {
                  ips.push(iface.address);
                }
              }
            }
            const primaryIp =
              ips.find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) ||
              ips[0] ||
              '127.0.0.1';
            const hostHeader = req.headers.host || 'localhost:3000';
            const port = hostHeader.split(':')[1] || '3000';

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                ips,
                primaryIp,
                port,
                mobileUrl: `http://${primaryIp}:${port}`,
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err?.message }));
          }
          return;
        }

        // 5. API Mở hộp thoại chọn vị trí lưu file mới (SaveFileDialog của Windows)
        if (req.url === '/api/storage/browse-save' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              let defaultPath = '';
              try {
                const parsed = JSON.parse(body || '{}');
                defaultPath = parsed.defaultPath || '';
              } catch (_) {}

              let initialDir = '';
              let defaultFileName = 'du_lieu_du_an.json';
              if (defaultPath) {
                try {
                  const resolved = path.resolve(defaultPath);
                  initialDir = path.dirname(resolved);
                  defaultFileName = path.basename(resolved);
                } catch (_) {}
              }

              const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$dlg = New-Object System.Windows.Forms.SaveFileDialog
$dlg.Title = "Chọn nơi lưu file cơ sở dữ liệu ProjectM (.json)"
$dlg.Filter = "File JSON CSDL (*.json)|*.json|Tất cả các file (*.*)|*.*"
$dlg.FileName = "${defaultFileName}"
${initialDir && fs.existsSync(initialDir) ? `$dlg.InitialDirectory = "${initialDir.replace(/\\/g, '\\\\')}"` : ''}
$dlg.OverwritePrompt = $false
$result = $dlg.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.WriteLine($dlg.FileName)
}
`;
              const b64 = Buffer.from(psScript, 'utf16le').toString('base64');
              exec(
                `powershell.exe -NoProfile -ExecutionPolicy Bypass -Sta -EncodedCommand ${b64}`,
                { encoding: 'utf-8' },
                (err, stdout) => {
                  res.setHeader('Content-Type', 'application/json');
                  if (err) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, message: `Lỗi mở hộp thoại Windows: ${err.message}` }));
                    return;
                  }
                  const chosenPath = (stdout || '').trim();
                  if (chosenPath) {
                    res.end(JSON.stringify({ success: true, filePath: chosenPath }));
                  } else {
                    res.end(JSON.stringify({ success: false, cancelled: true, message: 'Người dùng đã hủy chọn.' }));
                  }
                }
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err?.message }));
            }
          });
          return;
        }

        // 6. API Mở hộp thoại chọn thư mục lưu (FolderBrowserDialog của Windows)
        if (req.url === '/api/storage/browse-folder' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              let defaultPath = '';
              try {
                const parsed = JSON.parse(body || '{}');
                defaultPath = parsed.defaultPath || '';
              } catch (_) {}

              let initialDir = '';
              if (defaultPath) {
                try {
                  const resolved = path.resolve(defaultPath);
                  initialDir = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);
                } catch (_) {}
              }

              const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$dlg = New-Object System.Windows.Forms.FolderBrowserDialog
$dlg.Description = "Chọn thư mục lưu cơ sở dữ liệu ProjectM"
$dlg.ShowNewFolderButton = $true
${initialDir && fs.existsSync(initialDir) ? `$dlg.SelectedPath = "${initialDir.replace(/\\/g, '\\\\')}"` : ''}
$result = $dlg.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.WriteLine($dlg.SelectedPath)
}
`;
              const b64 = Buffer.from(psScript, 'utf16le').toString('base64');
              exec(
                `powershell.exe -NoProfile -ExecutionPolicy Bypass -Sta -EncodedCommand ${b64}`,
                { encoding: 'utf-8' },
                (err, stdout) => {
                  res.setHeader('Content-Type', 'application/json');
                  if (err) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, message: `Lỗi mở hộp thoại Windows: ${err.message}` }));
                    return;
                  }
                  const chosenFolder = (stdout || '').trim();
                  if (chosenFolder) {
                    const fullPath = path.join(chosenFolder, 'du_lieu_du_an.json');
                    res.end(JSON.stringify({ success: true, folderPath: chosenFolder, filePath: fullPath }));
                  } else {
                    res.end(JSON.stringify({ success: false, cancelled: true, message: 'Người dùng đã hủy chọn.' }));
                  }
                }
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err?.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localStorageBridgePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'docx-vendor': ['docxtemplater', 'pizzip', 'docx-preview', 'file-saver'],
        },
      },
    },
  },
});

