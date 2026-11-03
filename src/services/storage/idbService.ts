import { AppDatabase } from '../../types/database';

const DB_NAME = 'ProjectM_OfflineDB';
const DB_VERSION = 1;

export const STORE_MAIN = 'app_database';
export const STORE_FILES = 'file_blobs';
export const STORE_BACKUPS = 'database_backups';

export interface BackupSnapshotItem {
  id: string; // "backup_2026-11-03_205000"
  timestamp: number;
  dateStr: string; // "03/11/2026 20:50:00"
  type: 'auto' | 'manual';
  note?: string;
  sizeKb: number;
  projectCount: number;
  contractCount: number;
  data: AppDatabase;
}

export interface FileBlobRecord {
  fileId: string;
  fileName: string;
  fileType?: string;
  dataUrl?: string; // Lưu dataUrl hoặc chuỗi base64
  blob?: Blob;
  size?: number;
  createdAt: string;
}

/**
 * Khởi tạo kết nối IndexedDB nội bộ chuẩn W3C
 */
export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('Trình duyệt không hỗ trợ IndexedDB'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Store lưu dữ liệu hệ thống
      if (!db.objectStoreNames.contains(STORE_MAIN)) {
        db.createObjectStore(STORE_MAIN);
      }

      // 2. Store lưu tệp đính kèm nhị phân
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'fileId' });
      }

      // 3. Store lưu trữ các bản snapshot sao lưu dự phòng xoay vòng
      if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
        const backupStore = db.createObjectStore(STORE_BACKUPS, { keyPath: 'id' });
        backupStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Không thể mở cơ sở dữ liệu IndexedDB'));
    };
  });
}

/**
 * Lưu toàn bộ cơ sở dữ liệu hệ thống vào IndexedDB
 */
export async function saveDatabaseToIdb(dbData: AppDatabase): Promise<boolean> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MAIN, 'readwrite');
      const store = tx.objectStore(STORE_MAIN);
      const req = store.put(dbData, 'current');

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Lỗi khi ghi dữ liệu vào IndexedDB:', error);
    return false;
  }
}

/**
 * Tải toàn bộ cơ sở dữ liệu từ IndexedDB
 */
export async function loadDatabaseFromIdb(): Promise<AppDatabase | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MAIN, 'readonly');
      const store = tx.objectStore(STORE_MAIN);
      const req = store.get('current');

      req.onsuccess = () => {
        resolve((req.result as AppDatabase) || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu từ IndexedDB:', error);
    return null;
  }
}

/**
 * Lưu tệp nhị phân / Base64 đính kèm vào IndexedDB
 */
export async function saveFileBlobToIdb(record: FileBlobRecord): Promise<boolean> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      const store = tx.objectStore(STORE_FILES);
      const req = store.put(record);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Lỗi khi lưu tệp đính kèm vào IndexedDB:', error);
    return false;
  }
}

/**
 * Lấy tệp đính kèm từ IndexedDB theo fileId
 */
export async function loadFileBlobFromIdb(fileId: string): Promise<FileBlobRecord | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const req = store.get(fileId);

      req.onsuccess = () => resolve((req.result as FileBlobRecord) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Lỗi khi đọc tệp từ IndexedDB:', error);
    return null;
  }
}

/**
 * Lưu một bản snapshot sao lưu dự phòng vào IndexedDB
 */
export async function saveBackupSnapshotToIdb(snapshot: BackupSnapshotItem): Promise<boolean> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BACKUPS, 'readwrite');
      const store = tx.objectStore(STORE_BACKUPS);
      const req = store.put(snapshot);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Lỗi khi lưu snapshot sao lưu vào IndexedDB:', error);
    return false;
  }
}

/**
 * Lấy danh sách tất cả các bản snapshot sao lưu dự phòng đã lưu (sắp xếp mới nhất lên đầu)
 */
export async function getBackupSnapshotsFromIdb(): Promise<BackupSnapshotItem[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BACKUPS, 'readonly');
      const store = tx.objectStore(STORE_BACKUPS);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as BackupSnapshotItem[]) || [];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bản sao lưu từ IndexedDB:', error);
    return [];
  }
}

/**
 * Xóa một bản snapshot sao lưu theo id
 */
export async function deleteBackupSnapshotFromIdb(backupId: string): Promise<boolean> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BACKUPS, 'readwrite');
      const store = tx.objectStore(STORE_BACKUPS);
      const req = store.delete(backupId);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Lỗi khi xóa bản sao lưu trong IndexedDB:', error);
    return false;
  }
}

/**
 * Cơ chế dọn dẹp xoay vòng: Chỉ giữ lại tối đa `keepMax` bản sao lưu gần nhất (mặc định 7 bản)
 */
export async function pruneOldBackups(keepMax: number = 7): Promise<void> {
  try {
    const snapshots = await getBackupSnapshotsFromIdb();
    if (snapshots.length <= keepMax) return;

    // Các bản sao lưu vượt quá giới hạn keepMax (cũ nhất) sẽ bị xóa
    const toDelete = snapshots.slice(keepMax);
    for (const item of toDelete) {
      await deleteBackupSnapshotFromIdb(item.id);
    }
  } catch (error) {
    console.error('Lỗi khi dọn dẹp các bản sao lưu cũ:', error);
  }
}

/**
 * Di chuyển không mất mát (Zero-loss migration):
 * Nếu IndexedDB đang trống nhưng LocalStorage có dữ liệu cũ, tự động import sang IndexedDB
 */
export async function autoMigrateFromLocalStorageIfEmpty(storageKey: string): Promise<AppDatabase | null> {
  try {
    const currentIdbData = await loadDatabaseFromIdb();
    if (currentIdbData && currentIdbData.projects && currentIdbData.projects.length > 0) {
      return currentIdbData;
    }

    // Kiểm tra LocalStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const localStr = window.localStorage.getItem(storageKey);
      if (localStr) {
        try {
          const parsed = JSON.parse(localStr) as AppDatabase;
          if (parsed && parsed.projects) {
            console.log('[IndexedDB Migration] Đang di chuyển dữ liệu từ LocalStorage sang IndexedDB...');
            await saveDatabaseToIdb(parsed);
            console.log('[IndexedDB Migration] Di chuyển dữ liệu thành công!');
            return parsed;
          }
        } catch (e) {
          console.warn('[IndexedDB Migration] Không thể đọc dữ liệu LocalStorage cũ:', e);
        }
      }
    }

    return currentIdbData;
  } catch (err) {
    console.error('[IndexedDB Migration] Lỗi kiểm tra migration:', err);
    return null;
  }
}
