import { AppDatabase } from '../../types/database';
import { DraftingDatabase } from '../../types/drafting';

const DB_NAME = 'ProjectM_OfflineDB';
const DB_VERSION = 2;

export const STORE_MAIN = 'app_database';
export const STORE_FILES = 'file_blobs';
export const STORE_BACKUPS = 'database_backups';
export const STORE_DRAFTING = 'drafting_database';

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

      // 4. Store lưu dữ liệu module soạn thảo văn bản (templates, drafts)
      if (!db.objectStoreNames.contains(STORE_DRAFTING)) {
        db.createObjectStore(STORE_DRAFTING);
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

      req.onsuccess = () => { db.close(); resolve(true); };
      req.onerror = () => { db.close(); reject(req.error); };
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
        db.close();
        resolve((req.result as AppDatabase) || null);
      };
      req.onerror = () => { db.close(); reject(req.error); };
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

      req.onsuccess = () => { db.close(); resolve(true); };
      req.onerror = () => { db.close(); reject(req.error); };
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

      req.onsuccess = () => { db.close(); resolve((req.result as FileBlobRecord) || null); };
      req.onerror = () => { db.close(); reject(req.error); };
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

      req.onsuccess = () => { db.close(); resolve(true); };
      req.onerror = () => { db.close(); reject(req.error); };
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
        db.close();
        const list = (req.result as BackupSnapshotItem[]) || [];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      req.onerror = () => { db.close(); reject(req.error); };
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

      req.onsuccess = () => { db.close(); resolve(true); };
      req.onerror = () => { db.close(); reject(req.error); };
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


// ==================== DRAFTING MODULE STORAGE ====================

const DEFAULT_DRAFTING_DB: DraftingDatabase = {
  templateFolders: [],
  docTemplates: [],
  draftDocuments: [],
};

const TPL_FILE_PREFIX = 'tpl_file_';

/**
 * Lưu file nhị phân .docx của biểu mẫu vào STORE_FILES (tách rời khỏi DraftingDatabase)
 */
export async function saveTemplateBinaryToIdb(
  templateId: string,
  fileName: string,
  fileBase64: string
): Promise<boolean> {
  if (!fileBase64) return false;
  return saveFileBlobToIdb({
    fileId: `${TPL_FILE_PREFIX}${templateId}`,
    fileName: fileName || `template_${templateId}.docx`,
    fileType: 'docx',
    dataUrl: fileBase64,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Đọc file nhị phân .docx của biểu mẫu từ STORE_FILES
 */
export async function getTemplateBinaryFromIdb(templateId: string): Promise<string | null> {
  try {
    const record = await loadFileBlobFromIdb(`${TPL_FILE_PREFIX}${templateId}`);
    return record?.dataUrl || null;
  } catch (err) {
    console.error('Lỗi khi tải file biểu mẫu từ STORE_FILES:', err);
    return null;
  }
}

/**
 * Xóa file nhị phân của biểu mẫu khi biểu mẫu bị xóa
 */
export async function deleteTemplateBinaryFromIdb(templateId: string): Promise<boolean> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      const store = tx.objectStore(STORE_FILES);
      const req = store.delete(`${TPL_FILE_PREFIX}${templateId}`);
      req.onsuccess = () => { db.close(); resolve(true); };
      req.onerror = () => { db.close(); resolve(false); };
    });
  } catch {
    return false;
  }
}

/**
 * Lưu toàn bộ dữ liệu module soạn thảo văn bản vào IndexedDB
 * Áp dụng kỹ thuật Tách rời lưu trữ (Decoupled Template Storage):
 * - File nhị phân .docx lớn được lưu độc lập vào STORE_FILES
 * - STORE_DRAFTING chỉ lưu metadata nhẹ (<10KB), giúp lưu/đọc tức thì không bị chậm
 */
export async function saveDraftingToIdb(data: DraftingDatabase): Promise<boolean> {
  try {
    // 1. Lưu các file nhị phân vào STORE_FILES nếu có
    const saveBinaryPromises = (data.docTemplates || []).map(async (tpl) => {
      if (tpl.fileBase64) {
        await saveTemplateBinaryToIdb(tpl.id, tpl.fileName || `${tpl.name}.docx`, tpl.fileBase64);
      }
    });
    await Promise.allSettled(saveBinaryPromises);

    // 2. Tạo bản sao lean metadata để ghi vào STORE_DRAFTING
    const leanTemplates = (data.docTemplates || []).map((tpl) => {
      // Loại bỏ previewHtml và fileBase64 khỏi STORE_DRAFTING để giữ kích thước siêu gọn
      const { previewHtml, ...rest } = tpl;
      return {
        ...rest,
        // Giữ lại cờ đánh dấu file có tồn tại
        hasFile: !!(tpl.fileBase64 || tpl.fileName),
      };
    });

    const leanData: DraftingDatabase = {
      templateFolders: data.templateFolders || [],
      docTemplates: leanTemplates as any,
      draftDocuments: data.draftDocuments || [],
    };

    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTING, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTING);
      const req = store.put(leanData, 'current');

      req.onsuccess = () => { db.close(); resolve(true); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch (error) {
    console.error('Lỗi khi ghi dữ liệu soạn thảo vào IndexedDB:', error);
    return false;
  }
}

/**
 * Tải toàn bộ dữ liệu module soạn thảo từ IndexedDB
 * Tự động nạp kèm fileBase64 từ STORE_FILES để đảm bảo đầy đủ dữ liệu
 */
export async function loadDraftingFromIdb(): Promise<DraftingDatabase> {
  try {
    const db = await openIndexedDB();
    const rawData = await new Promise<DraftingDatabase>((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTING, 'readonly');
      const store = tx.objectStore(STORE_DRAFTING);
      const req = store.get('current');

      req.onsuccess = () => {
        db.close();
        resolve((req.result as DraftingDatabase) || { ...DEFAULT_DRAFTING_DB });
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });

    const docTemplates = rawData.docTemplates || [];

    // Nạp lại fileBase64 từ STORE_FILES cho từng mẫu nếu chưa có sẵn
    const hydratedTemplates = await Promise.all(
      docTemplates.map(async (tpl) => {
        if (tpl.fileBase64) return tpl;
        const binary = await getTemplateBinaryFromIdb(tpl.id);
        return {
          ...tpl,
          fileBase64: binary || undefined,
        };
      })
    );

    return {
      templateFolders: rawData.templateFolders || [],
      docTemplates: hydratedTemplates,
      draftDocuments: rawData.draftDocuments || [],
    };
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu soạn thảo từ IndexedDB:', error);
    return { ...DEFAULT_DRAFTING_DB };
  }
}
