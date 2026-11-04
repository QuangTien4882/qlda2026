import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import os from 'os';

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
});

