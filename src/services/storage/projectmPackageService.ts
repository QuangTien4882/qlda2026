import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { AppDatabase } from '../../types/database';
import { DraftingDatabase } from '../../types/drafting';
import { 
  loadDraftingFromIdb, 
  saveDraftingToIdb, 
  getAllFileBlobsFromIdb, 
  restoreFileBlobsToIdb, 
  saveDatabaseToIdb, 
  FileBlobRecord 
} from './idbService';

export interface PackageManifestStats {
  projectsCount: number;
  costPackagesCount: number;
  inspectionsCount: number;
  legalDocsCount: number;
  templatesCount: number;
  attachmentsCount: number;
}

export interface PackageManifest {
  appName: string;
  version: string;
  format: 'projectm_full_package_v1';
  exportedAt: string;
  note?: string;
  stats: PackageManifestStats;
}

export interface PackageInspectionResult {
  isPackage: boolean;
  isValid: boolean;
  manifest?: PackageManifest;
  stats: PackageManifestStats;
  database?: AppDatabase;
  drafting?: DraftingDatabase;
  attachments?: FileBlobRecord[];
  errorMessage?: string;
}

/**
 * Đóng gói toàn vẹn CSDL, Module Soạn thảo & Toàn bộ tệp đính kèm nhị phân thành file .projectm
 */
export async function exportFullProjectMPackage(
  database: AppDatabase,
  note?: string
): Promise<{ success: boolean; message: string; stats?: PackageManifestStats; fileName?: string }> {
  try {
    // 1. Nạp dữ liệu soạn thảo văn bản
    const draftingData = await loadDraftingFromIdb();

    // 2. Nạp toàn bộ tệp đính kèm nhị phân từ STORE_FILES
    const fileBlobs = await getAllFileBlobsFromIdb();

    // 3. Tính toán thống kê dữ liệu
    const stats: PackageManifestStats = {
      projectsCount: database.projects?.length || 0,
      costPackagesCount: Object.values(database.costPackages || {}).reduce((s, p) => s + (p?.length || 0), 0),
      inspectionsCount: Object.values(database.inspections || {}).reduce((s, p) => s + (p?.length || 0), 0),
      legalDocsCount: Object.values(database.legalDocs || {}).reduce((s, p) => s + (p?.length || 0), 0),
      templatesCount: draftingData.docTemplates?.length || 0,
      attachmentsCount: fileBlobs.length,
    };

    // 4. Tạo manifest gói sao lưu
    const manifest: PackageManifest = {
      appName: 'ProjectM',
      version: '1.0.0',
      format: 'projectm_full_package_v1',
      exportedAt: new Date().toISOString(),
      note: note || 'Bản sao lưu đóng gói toàn vẹn ProjectM (.projectm)',
      stats,
    };

    // 5. Khởi tạo kho nén zip với PizZip
    const zip = new PizZip();
    zip.file('package_manifest.json', JSON.stringify(manifest, null, 2));
    zip.file('database.json', JSON.stringify(database, null, 2));
    zip.file('drafting.json', JSON.stringify(draftingData, null, 2));
    zip.file('attachments_registry.json', JSON.stringify(fileBlobs, null, 2));

    // 6. Xuất nhị phân và kích hoạt tải về
    const uint8 = zip.generate({ type: 'uint8array' });
    const blob = new Blob([uint8], { type: 'application/octet-stream' });

    const now = new Date();
    const safeDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `projectm_full_backup_${safeDate}.projectm`;

    saveAs(blob, fileName);

    return {
      success: true,
      message: `Đã đóng gói thành công ${stats.projectsCount} dự án, ${stats.templatesCount} mẫu văn bản và ${stats.attachmentsCount} tệp đính kèm vào file "${fileName}".`,
      stats,
      fileName,
    };
  } catch (err: unknown) {
    console.error('Lỗi khi xuất gói sao lưu .projectm:', err);
    return {
      success: false,
      message: `Lỗi đóng gói sao lưu: ${err instanceof Error ? err.message : 'Không xác định'}`,
    };
  }
}

/**
 * Đọc kiểm tra cấu trúc file sao lưu (.projectm hoặc .json) trước khi khôi phục
 */
export async function inspectBackupFile(file: File): Promise<PackageInspectionResult> {
  const fileName = file.name.toLowerCase();

  // 1. Nếu là gói nén .projectm hoặc .zip
  if (fileName.endsWith('.projectm') || fileName.endsWith('.zip')) {
    try {
      const buffer = await file.arrayBuffer();
      const zip = new PizZip(buffer);

      // Đọc manifest hoặc database
      const manifestFile = zip.file('package_manifest.json');
      let manifest: PackageManifest | undefined;
      if (manifestFile) {
        try {
          manifest = JSON.parse(manifestFile.asText());
        } catch (_) {}
      }

      const dbFile = zip.file('database.json');
      if (!dbFile) {
        return {
          isPackage: true,
          isValid: false,
          stats: { projectsCount: 0, costPackagesCount: 0, inspectionsCount: 0, legalDocsCount: 0, templatesCount: 0, attachmentsCount: 0 },
          errorMessage: 'File .projectm bị lỗi: không tìm thấy file database.json bên trong.',
        };
      }

      const database: AppDatabase = JSON.parse(dbFile.asText());

      let drafting: DraftingDatabase | undefined;
      const draftingFile = zip.file('drafting.json');
      if (draftingFile) {
        try {
          drafting = JSON.parse(draftingFile.asText());
        } catch (_) {}
      }

      let attachments: FileBlobRecord[] = [];
      const attachFile = zip.file('attachments_registry.json');
      if (attachFile) {
        try {
          attachments = JSON.parse(attachFile.asText());
        } catch (_) {}
      }

      const stats: PackageManifestStats = manifest?.stats || {
        projectsCount: database.projects?.length || 0,
        costPackagesCount: Object.values(database.costPackages || {}).reduce((s, p) => s + (p?.length || 0), 0),
        inspectionsCount: Object.values(database.inspections || {}).reduce((s, p) => s + (p?.length || 0), 0),
        legalDocsCount: Object.values(database.legalDocs || {}).reduce((s, p) => s + (p?.length || 0), 0),
        templatesCount: drafting?.docTemplates?.length || 0,
        attachmentsCount: attachments.length,
      };

      return {
        isPackage: true,
        isValid: true,
        manifest,
        stats,
        database,
        drafting,
        attachments,
      };
    } catch (err: unknown) {
      return {
        isPackage: true,
        isValid: false,
        stats: { projectsCount: 0, costPackagesCount: 0, inspectionsCount: 0, legalDocsCount: 0, templatesCount: 0, attachmentsCount: 0 },
        errorMessage: `Không thể đọc gói sao lưu .projectm: ${err instanceof Error ? err.message : 'Tệp bị lỗi hoặc hỏng'}`,
      };
    }
  }

  // 2. Nếu là file .json CSDL truyền thống
  try {
    const text = await file.text();
    const database: AppDatabase = JSON.parse(text);

    if (!database || !Array.isArray(database.projects)) {
      return {
        isPackage: false,
        isValid: false,
        stats: { projectsCount: 0, costPackagesCount: 0, inspectionsCount: 0, legalDocsCount: 0, templatesCount: 0, attachmentsCount: 0 },
        errorMessage: 'File JSON không đúng cấu trúc cơ sở dữ liệu ProjectM.',
      };
    }

    const stats: PackageManifestStats = {
      projectsCount: database.projects.length,
      costPackagesCount: Object.values(database.costPackages || {}).reduce((s, p) => s + (p?.length || 0), 0),
      inspectionsCount: Object.values(database.inspections || {}).reduce((s, p) => s + (p?.length || 0), 0),
      legalDocsCount: Object.values(database.legalDocs || {}).reduce((s, p) => s + (p?.length || 0), 0),
      templatesCount: 0,
      attachmentsCount: 0,
    };

    return {
      isPackage: false,
      isValid: true,
      stats,
      database,
    };
  } catch (err: unknown) {
    return {
      isPackage: false,
      isValid: false,
      stats: { projectsCount: 0, costPackagesCount: 0, inspectionsCount: 0, legalDocsCount: 0, templatesCount: 0, attachmentsCount: 0 },
      errorMessage: `Lỗi đọc file JSON: ${err instanceof Error ? err.message : 'Không xác định'}`,
    };
  }
}

/**
 * Thực hiện khôi phục toàn vẹn dữ liệu từ kết quả kiểm tra gói sao lưu
 */
export async function applyRestorePackage(
  inspected: PackageInspectionResult
): Promise<{ success: boolean; message: string; database?: AppDatabase }> {
  if (!inspected.isValid || !inspected.database) {
    return {
      success: false,
      message: inspected.errorMessage || 'Dữ liệu sao lưu không hợp lệ.',
    };
  }

  try {
    // 1. Khôi phục cơ sở dữ liệu chính
    await saveDatabaseToIdb(inspected.database);

    // 2. Khôi phục module soạn thảo nếu có
    if (inspected.drafting) {
      await saveDraftingToIdb(inspected.drafting);
    }

    // 3. Khôi phục toàn bộ tệp đính kèm nhị phân nếu có
    if (inspected.attachments && inspected.attachments.length > 0) {
      await restoreFileBlobsToIdb(inspected.attachments);
    }

    const { stats } = inspected;
    const msg = inspected.isPackage
      ? `Đã khôi phục thành công toàn bộ hệ thống gồm ${stats.projectsCount} dự án, ${stats.templatesCount} biểu mẫu và ${stats.attachmentsCount} tệp đính kèm!`
      : `Đã khôi phục thành công ${stats.projectsCount} dự án từ file JSON!`;

    return {
      success: true,
      message: msg,
      database: inspected.database,
    };
  } catch (err: unknown) {
    console.error('Lỗi khi áp dụng khôi phục:', err);
    return {
      success: false,
      message: `Lỗi khi khôi phục dữ liệu: ${err instanceof Error ? err.message : 'Không xác định'}`,
    };
  }
}
