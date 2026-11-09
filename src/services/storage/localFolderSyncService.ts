import { AppDatabase } from '../../types/database';
import { 
  saveSyncDirectoryHandle, 
  getSyncDirectoryHandle, 
  removeSyncDirectoryHandle 
} from './idbService';

export interface LocalFolderSyncStatus {
  isSupported: boolean;
  isConnected: boolean;
  folderName: string;
  lastSyncTime: string;
  hasPermission: boolean;
  status: 'synced' | 'syncing' | 'permission_needed' | 'disconnected' | 'error';
  errorMessage?: string;
}

export interface DetectedDbFile {
  fileName: string;
  projectCount: number;
  sizeBytes: number;
  lastModified: string;
  data: AppDatabase;
}

/** Danh sách tên tệp CSDL phổ biến của ProjectM cần ưu tiên rà quét */
const KNOWN_DB_FILENAMES = ['projectm_data.json', 'Duan_Data.json', 'du_lieu_du_an.json'];

/**
 * Kiểm tra trình duyệt có hỗ trợ File System Access API (showDirectoryPicker) hay không
 */
export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Xác thực quyền đọc/ghi trên FileSystemHandle
 */
export async function verifyDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  readWrite = true
): Promise<boolean> {
  try {
    const handleAny = handle as unknown as {
      queryPermission?: (opts: { mode: string }) => Promise<string>;
      requestPermission?: (opts: { mode: string }) => Promise<string>;
    };
    const opts = {
      mode: readWrite ? 'readwrite' : 'read',
    };
    if (handleAny.queryPermission && (await handleAny.queryPermission(opts)) === 'granted') {
      return true;
    }
    if (handleAny.requestPermission && (await handleAny.requestPermission(opts)) === 'granted') {
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Lỗi kiểm tra quyền thư mục:', e);
    return false;
  }
}

/**
 * Rà quét thư mục để tìm tất cả các tệp CSDL ProjectM hợp lệ
 */
export async function scanDirectoryForDatabaseFiles(
  dirHandle: FileSystemDirectoryHandle
): Promise<DetectedDbFile[]> {
  const detectedFiles: DetectedDbFile[] = [];

  // 1. Thử đọc các tên tệp quen thuộc trước
  for (const fileName of KNOWN_DB_FILENAMES) {
    try {
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
      const file = await fileHandle.getFile();
      const text = await file.text();
      const parsed = JSON.parse(text) as AppDatabase;

      if (parsed && Array.isArray(parsed.projects)) {
        detectedFiles.push({
          fileName,
          projectCount: parsed.projects.length,
          sizeBytes: file.size,
          lastModified: new Date(file.lastModified).toLocaleString('vi-VN'),
          data: parsed,
        });
      }
    } catch {
      // Bỏ qua nếu file không tồn tại hoặc lỗi parse
    }
  }

  // Sắp xếp ưu tiên: tệp có số lượng dự án nhiều nhất, sau đó dung lượng lớn nhất
  detectedFiles.sort((a, b) => {
    if (b.projectCount !== a.projectCount) {
      return b.projectCount - a.projectCount;
    }
    return b.sizeBytes - a.sizeBytes;
  });

  return detectedFiles;
}

/**
 * Đọc bản CSDL tốt nhất có sẵn trong thư mục
 */
export async function readBestDatabaseFromDirectory(
  dirHandle: FileSystemDirectoryHandle
): Promise<{
  success: boolean;
  data?: AppDatabase;
  fileName?: string;
  projectCount?: number;
  message: string;
}> {
  try {
    const files = await scanDirectoryForDatabaseFiles(dirHandle);
    if (files.length === 0) {
      return {
        success: false,
        message: `Thư mục "${dirHandle.name}" chưa chứa tệp dữ liệu nào của ProjectM.`,
      };
    }

    const best = files[0];
    return {
      success: true,
      data: best.data,
      fileName: best.fileName,
      projectCount: best.projectCount,
      message: `Đã tìm thấy tệp "${best.fileName}" chứa ${best.projectCount} dự án (${(best.sizeBytes / 1024).toFixed(1)} KB).`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: `Lỗi đọc dữ liệu từ thư mục: ${err instanceof Error ? err.message : 'Không xác định'}`,
    };
  }
}

/**
 * Mở hộp thoại chọn thư mục máy tính và lưu handle vào IndexedDB
 */
export async function pickAndConnectLocalFolder(): Promise<{
  success: boolean;
  handle?: FileSystemDirectoryHandle;
  folderName?: string;
  existingData?: AppDatabase;
  existingFileName?: string;
  projectCount?: number;
  message: string;
}> {
  if (!isDirectoryPickerSupported()) {
    return {
      success: false,
      message: 'Trình duyệt hiện tại chưa hỗ trợ File System Access API. Bạn nên dùng Google Chrome hoặc Microsoft Edge trên máy tính.',
    };
  }

  try {
    const windowAny = window as unknown as { showDirectoryPicker: (opts?: unknown) => Promise<FileSystemDirectoryHandle> };
    const dirHandle = await windowAny.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });

    if (!dirHandle) {
      return { success: false, message: 'Người dùng đã hủy chọn thư mục.' };
    }

    // Kiểm tra quyền ghi
    const hasPerm = await verifyDirectoryPermission(dirHandle, true);
    if (!hasPerm) {
      return {
        success: false,
        message: 'Bạn chưa cấp quyền ghi cho thư mục đã chọn.',
      };
    }

    // Lưu handle vào IndexedDB
    await saveSyncDirectoryHandle(dirHandle);

    // Tự động rà quét xem thư mục này đã có sẵn dữ liệu trước đó hay chưa
    const bestCheck = await readBestDatabaseFromDirectory(dirHandle);

    let msg = `Đã kết nối thành công với thư mục "${dirHandle.name}".`;
    if (bestCheck.success && (bestCheck.projectCount || 0) > 0) {
      msg += ` Phát hiện có sẵn ${bestCheck.projectCount} dự án trong tệp "${bestCheck.fileName}".`;
    } else {
      msg += ` Dữ liệu sẽ được tự động đồng bộ vào tệp projectm_data.json.`;
    }

    return {
      success: true,
      handle: dirHandle,
      folderName: dirHandle.name,
      existingData: bestCheck.data,
      existingFileName: bestCheck.fileName,
      projectCount: bestCheck.projectCount,
      message: msg,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, message: 'Đã hủy chọn thư mục.' };
    }
    return {
      success: false,
      message: `Không thể kết nối thư mục: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`,
    };
  }
}

/**
 * Ghi tự động CSDL ra file projectm_data.json trong thư mục đã kết nối
 * Có cơ chế bảo vệ: Không bao giờ ghi đè database rỗng lên file đang chứa dữ liệu!
 */
export async function syncDatabaseToLocalDirectory(
  dirHandle: FileSystemDirectoryHandle,
  data: AppDatabase
): Promise<{ success: boolean; message: string; writtenAt: string; sizeBytes: number }> {
  try {
    // CƠ CHẾ BẢO VỆ DỮ LIỆU: Nếu data hiện tại rỗng (0 dự án), kiểm tra xem file trên đĩa có dữ liệu không
    if (!data.projects || data.projects.length === 0) {
      const existing = await readBestDatabaseFromDirectory(dirHandle);
      if (existing.success && (existing.projectCount || 0) > 0) {
        console.warn(`[LocalFolderSync] Ngăn chặn ghi đè dữ liệu rỗng lên tệp ${existing.fileName} chứa ${existing.projectCount} dự án.`);
        return {
          success: false,
          message: `Từ chối ghi: Bộ nhớ tạm hiện tại rỗng (0 dự án). Hệ thống tự động bảo vệ tệp "${existing.fileName}" chứa ${existing.projectCount} dự án trên máy của bạn không bị xóa.`,
          writtenAt: '',
          sizeBytes: 0,
        };
      }
    }

    const fileHandle = await dirHandle.getFileHandle('projectm_data.json', { create: true });
    const writable = await fileHandle.createWritable();
    const jsonStr = JSON.stringify(data, null, 2);
    await writable.write(jsonStr);
    await writable.close();

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const bytes = new Blob([jsonStr]).size;

    return {
      success: true,
      message: `Đã tự động ghi ${data.projects?.length || 0} dự án vào thư mục "${dirHandle.name}/projectm_data.json"`,
      writtenAt: timeStr,
      sizeBytes: bytes,
    };
  } catch (err: unknown) {
    console.error('Lỗi khi ghi ra thư mục máy tính:', err);
    return {
      success: false,
      message: `Lỗi ghi dữ liệu vào thư mục: ${err instanceof Error ? err.message : 'Không xác định'}`,
      writtenAt: '',
      sizeBytes: 0,
    };
  }
}

/**
 * Đọc dữ liệu CSDL từ file projectm_data.json trong thư mục
 */
export async function readDatabaseFromLocalDirectory(
  dirHandle: FileSystemDirectoryHandle
): Promise<{ success: boolean; data?: AppDatabase; message: string }> {
  return await readBestDatabaseFromDirectory(dirHandle);
}

/**
 * Ngắt kết nối thư mục tự động đồng bộ
 */
export async function disconnectLocalFolderSync(): Promise<boolean> {
  return await removeSyncDirectoryHandle();
}

/**
 * Khôi phục kết nối thư mục từ IndexedDB khi tải trang
 */
export async function restoreLocalFolderHandle(): Promise<{
  handle: FileSystemDirectoryHandle | null;
  hasPermission: boolean;
  folderName: string;
}> {
  const handle = await getSyncDirectoryHandle();
  if (!handle) {
    return { handle: null, hasPermission: false, folderName: '' };
  }

  try {
    const handleAny = handle as unknown as { queryPermission?: (opts: { mode: string }) => Promise<string> };
    const hasPerm = handleAny.queryPermission
      ? (await handleAny.queryPermission({ mode: 'readwrite' })) === 'granted'
      : false;
    return {
      handle,
      hasPermission: hasPerm,
      folderName: handle.name,
    };
  } catch {
    return { handle: null, hasPermission: false, folderName: '' };
  }
}
