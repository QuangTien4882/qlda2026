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
 * Mở hộp thoại chọn thư mục máy tính và lưu handle vào IndexedDB
 */
export async function pickAndConnectLocalFolder(): Promise<{
  success: boolean;
  handle?: FileSystemDirectoryHandle;
  folderName?: string;
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

    return {
      success: true,
      handle: dirHandle,
      folderName: dirHandle.name,
      message: `Đã kết nối thành công với thư mục "${dirHandle.name}". Mọi thay đổi dữ liệu sẽ được tự động đồng bộ vào file projectm_data.json trong thư mục này!`,
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
 */
export async function syncDatabaseToLocalDirectory(
  dirHandle: FileSystemDirectoryHandle,
  data: AppDatabase
): Promise<{ success: boolean; message: string; writtenAt: string; sizeBytes: number }> {
  try {
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
  try {
    const fileHandle = await dirHandle.getFileHandle('projectm_data.json', { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    const parsed: AppDatabase = JSON.parse(text);

    if (!parsed || !Array.isArray(parsed.projects)) {
      return {
        success: false,
        message: 'File projectm_data.json trong thư mục không đúng cấu trúc CSDL ProjectM.',
      };
    }

    return {
      success: true,
      data: parsed,
      message: `Đã nạp thành công ${parsed.projects.length} dự án từ thư mục "${dirHandle.name}".`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: `Không thể đọc file từ thư mục: ${err instanceof Error ? err.message : 'File chưa tồn tại'}`,
    };
  }
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
