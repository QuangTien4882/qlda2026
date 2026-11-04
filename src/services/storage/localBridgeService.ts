import { AppDatabase } from '../../types/database';

export interface BridgeWriteResult {
  success: boolean;
  message: string;
  filePath?: string;
  sizeBytes?: number;
  modifiedAt?: string;
}

export interface BridgeReadResult {
  success: boolean;
  message: string;
  data?: AppDatabase;
  filePath?: string;
  sizeBytes?: number;
  modifiedAt?: string;
}

export interface BridgeCheckResult {
  success: boolean;
  exists: boolean;
  message?: string;
  filePath?: string;
  sizeBytes?: number;
  modifiedAt?: string;
}

/**
 * Ghi trực tiếp CSDL vào file JSON trên ổ cứng máy tính qua Local Bridge API
 */
export async function writeDatabaseToFileViaBridge(
  filePath: string,
  data: AppDatabase
): Promise<BridgeWriteResult> {
  try {
    const res = await fetch('/api/storage/write', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath, data }),
    });

    const result = await res.json();
    return result;
  } catch (err: any) {
    console.warn('[LocalBridge] Không thể kết nối tới Bridge API (có thể đang chạy môi trường tĩnh):', err);
    return {
      success: false,
      message: `Không thể kết nối tới dịch vụ ghi ổ đĩa: ${err?.message || 'Lỗi mạng nội bộ'}`,
    };
  }
}

/**
 * Đọc trực tiếp CSDL từ file JSON trên ổ cứng máy tính qua Local Bridge API
 */
export async function readDatabaseFromFileViaBridge(filePath: string): Promise<BridgeReadResult> {
  try {
    const res = await fetch('/api/storage/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });

    const result = await res.json();
    return result;
  } catch (err: any) {
    return {
      success: false,
      message: `Không thể đọc file từ ổ đĩa: ${err?.message || 'Lỗi mạng nội bộ'}`,
    };
  }
}

/**
 * Kiểm tra trạng thái file trên ổ đĩa máy tính
 */
export async function checkFileOnDiskViaBridge(filePath: string): Promise<BridgeCheckResult> {
  try {
    const res = await fetch('/api/storage/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });

    const result = await res.json();
    return result;
  } catch (err: any) {
    return {
      success: false,
      exists: false,
      message: err?.message,
    };
  }
}

/**
 * Lấy thông tin mạng LAN của máy tính để kết nối trên điện thoại di động
 */
export async function getNetworkInfo(): Promise<{
  success: boolean;
  primaryIp: string;
  port: string;
  mobileUrl: string;
  ips: string[];
}> {
  try {
    const res = await fetch('/api/network/info');
    const data = await res.json();
    return data;
  } catch {
    return {
      success: false,
      primaryIp: '127.0.0.1',
      port: window.location.port || '3000',
      mobileUrl: window.location.origin,
      ips: [],
    };
  }
}

/**
 * Kích hoạt quyền lưu trữ bền vững (Persistent Storage) của trình duyệt
 * Ngăn trình duyệt tự ý xóa dữ liệu IndexedDB khi người dùng dọn dẹp bộ nhớ đệm
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[Storage] Trạng thái Persistent Storage:', isPersisted ? 'ĐÃ BẢO VỆ VĨNH VIỄN' : 'MẶC ĐỊNH');
      return isPersisted;
    } catch (e) {
      console.warn('[Storage] Không thể yêu cầu Persistent Storage:', e);
      return false;
    }
  }
  return false;
}
