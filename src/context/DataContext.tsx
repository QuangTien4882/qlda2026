import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  ProjectListItem, 
  ProjectDetailItem, 
  EstimateItem, 
  CostPackageItem, 
  InspectionItem, 
  LegalDocItem, 
  CompanyInfo,
  PlanTaskItem,
  CostBreakdownItem,
  SevenCostCategory,
  ContractAppendixItem
} from '../types/project';
import { AppDatabase } from '../types/database';
import { 
  saveDatabaseToIdb, 
  loadDatabaseFromIdb, 
  saveBackupSnapshotToIdb, 
  getBackupSnapshotsFromIdb, 
  deleteBackupSnapshotFromIdb, 
  pruneOldBackups, 
  autoMigrateFromLocalStorageIfEmpty, 
  BackupSnapshotItem,
  loadDraftingFromIdb,
  saveDraftingToIdb
} from '../services/storage/idbService';
import { 
  writeDatabaseToFileViaBridge, 
  readDatabaseFromFileViaBridge, 
  checkFileOnDiskViaBridge, 
  requestPersistentStorage 
} from '../services/storage/localBridgeService';
import { formatCustomVnDate } from '../utils/dateUtils';

const STORAGE_KEY = 'projectm_master_database_v3';
const APP_VERSION = '1.0.0';
const DEFAULT_DISK_PATH = 'D:\\1. BQL Ban Thach\\CSDL (CAM XOA)\\du_lieu_du_an.json';
const DISK_PATH_STORAGE_KEY = 'projectm_disk_file_path';

interface DataContextType {
  // Dữ liệu
  projects: ProjectListItem[];
  projectDetails: Record<string, ProjectDetailItem>;
  estimates: Record<string, EstimateItem[]>;
  costPackages: Record<string, CostPackageItem[]>;
  inspections: Record<string, InspectionItem[]>;
  legalDocs: Record<string, LegalDocItem[]>;
  companies: CompanyInfo[];
  planTasks: Record<string, PlanTaskItem[]>;
  costBreakdowns: Record<string, CostBreakdownItem[]>;
  contractAppendices: Record<string, ContractAppendixItem[]>;

  // Trạng thái lưu trữ
  lastSavedTime: string;
  storageSizeKb: number;
  isDirectFileConnected: boolean;
  connectedFileName: string;

  // Lưu trữ ổ cứng máy tính vật lý (Windows Local Storage Bridge)
  diskFilePath: string;
  setDiskFilePath: (path: string) => void;
  isBridgeActive: boolean;
  lastDiskWriteTime: string;
  diskFileSize: number;
  syncNowToDisk: (customPath?: string) => Promise<{ success: boolean; message: string; filePath?: string }>;
  reloadFromDisk: (customPath?: string) => Promise<{ success: boolean; message: string }>;

  // Thao tác Dự án
  addProject: (project: ProjectListItem, detail?: ProjectDetailItem) => void;
  updateProject: (project: ProjectListItem, detail?: ProjectDetailItem) => void;
  deleteProject: (projectId: string) => void;

  // Thao tác Dự toán
  addEstimate: (item: EstimateItem) => void;
  updateEstimate: (item: EstimateItem) => void;
  deleteEstimate: (projectId: string, id: string) => void;

  // Thao tác Chi tiết cấu thành 7 loại chi phí (Tab 1 Dự án & Tab 2 Dự toán)
  saveCostBreakdowns: (
    projectId: string,
    parentId: string,
    costCategory: SevenCostCategory,
    items: CostBreakdownItem[]
  ) => number;

  // Thao tác Nội dung chi phí / Hợp đồng
  addCostPackage: (item: CostPackageItem) => void;
  updateCostPackage: (item: CostPackageItem) => void;
  deleteCostPackage: (projectId: string, id: string) => void;

  // Thao tác Phụ lục Hợp đồng (PLHĐ)
  saveContractAppendix: (appendix: ContractAppendixItem) => void;
  deleteContractAppendix: (projectId: string, appendixId: string) => void;
  getContractAppendicesByPackage: (projectId: string, costPackageId: string) => ContractAppendixItem[];
  getEffectiveContractValue: (projectId: string, costPackageId: string) => number;

  // Thao tác Nghiệm thu
  addInspection: (item: InspectionItem) => void;
  updateInspection: (item: InspectionItem) => void;
  deleteInspection: (projectId: string, id: string) => void;

  // Thao tác Hồ sơ pháp lý
  addLegalDoc: (item: LegalDocItem) => void;
  updateLegalDoc: (item: LegalDocItem) => void;
  deleteLegalDoc: (projectId: string, id: string) => void;

  // Thao tác Kế hoạch dự án (Tab 6)
  addPlanTask: (item: PlanTaskItem) => void;
  updatePlanTask: (item: PlanTaskItem) => void;
  deletePlanTask: (projectId: string, id: string) => void;

  // Thao tác Danh mục công ty / Nhà thầu
  addCompany: (item: CompanyInfo) => void;
  updateCompany: (item: CompanyInfo) => void;
  deleteCompany: (id: string) => void;

  // Sao lưu / Phục hồi / File Google Drive
  exportDatabaseToJson: (filename?: string) => Promise<void>;
  importDatabaseFromJson: (file: File) => Promise<{ success: boolean; message: string }>;
  resetDatabaseToDefaults: () => void;
  selectSaveDirectory: () => Promise<{ success: boolean; message: string; dirName?: string }>;
  saveDatabaseAs: () => Promise<{ success: boolean; message: string; fileName?: string }>;
  connectDirectFile: () => Promise<{ success: boolean; message: string }>;
  disconnectDirectFile: () => void;
  writeCurrentDataToSelectedFile: () => Promise<{ success: boolean; message: string; fileName?: string }>;
  forceWriteToCurrentFile: () => Promise<{ success: boolean; message: string }>;

  // Quản lý sao lưu dự phòng định kỳ & IndexedDB
  createManualBackup: (note?: string) => Promise<boolean>;
  restoreFromBackup: (backupItem: BackupSnapshotItem) => Promise<boolean>;
  getBackupList: () => Promise<BackupSnapshotItem[]>;
  deleteBackup: (backupId: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Dữ liệu trống hoàn toàn để người dùng test và làm việc bằng dữ liệu thật 100%
const getDefaultDatabase = (): AppDatabase => ({
  metadata: {
    version: APP_VERSION,
    appName: 'ProjectM - Phần mềm Quản lý Dự án ĐTXD',
    exportedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    totalProjects: 0,
  },
  projects: [],
  projectDetails: {},
  estimates: {},
  costPackages: {},
  inspections: {},
  legalDocs: {},
  planTasks: {},
  costBreakdowns: {},
  contractAppendices: {},
  companies: [],
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Khởi tạo từ LocalStorage nếu có, tự động dọn sạch các cơ sở dữ liệu mẫu cũ
  const [database, setDatabase] = useState<AppDatabase>(() => {
    // 1. Dọn dẹp các key phiên bản cũ chứa dữ liệu mẫu
    try {
      localStorage.removeItem('projectm_master_database_v1');
      localStorage.removeItem('projectm_master_database_v2');
      localStorage.removeItem('projectm_database');
    } catch {
      // ignore
    }

    // 2. Kiểm tra dữ liệu trong key v3
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Kiểm tra nếu là dữ liệu mẫu cũ còn sót lại (có prj-01 hoặc CC1), dọn sạch để dùng dữ liệu thật
        const hasSampleProjects = parsed.projects?.some((p: any) => p.id === 'prj-01' || p.code === 'DA-2026/01');
        const hasSampleCompanies = parsed.companies?.some((c: any) => c.shortName === 'CC1');
        
        if (!hasSampleProjects && !hasSampleCompanies && parsed.projects && Array.isArray(parsed.projects)) {
          return {
            metadata: parsed.metadata || getDefaultDatabase().metadata,
            projects: parsed.projects || [],
            projectDetails: parsed.projectDetails || {},
            estimates: parsed.estimates || {},
            costPackages: parsed.costPackages || {},
            inspections: parsed.inspections || {},
            legalDocs: parsed.legalDocs || {},
            planTasks: parsed.planTasks || {},
            costBreakdowns: parsed.costBreakdowns || {},
            contractAppendices: parsed.contractAppendices || {},
            companies: parsed.companies || [],
          };
        }
      }
    } catch (e) {
      console.error('Lỗi nạp database từ localStorage:', e);
    }

    // Khởi tạo database hoàn toàn trắng, sẵn sàng cho dữ liệu thật
    const emptyDb = getDefaultDatabase();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyDb));
    } catch {
      // ignore
    }
    return emptyDb;
  });

  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa mới lưu');
  const [storageSizeKb, setStorageSizeKb] = useState<number>(0);
  const [isDirectFileConnected, setIsDirectFileConnected] = useState(false);
  const [connectedFileName, setConnectedFileName] = useState('du_lieu_du_an.json');

  // Lưu trữ ổ cứng máy tính vật lý (Windows Local Storage Bridge)
  const [diskFilePath, setDiskFilePathState] = useState<string>(() => {
    try {
      return localStorage.getItem(DISK_PATH_STORAGE_KEY) || DEFAULT_DISK_PATH;
    } catch {
      return DEFAULT_DISK_PATH;
    }
  });
  const [isBridgeActive, setIsBridgeActive] = useState(false);
  const [lastDiskWriteTime, setLastDiskWriteTime] = useState('');
  const [diskFileSize, setDiskFileSize] = useState(0);

  const setDiskFilePath = (path: string) => {
    setDiskFilePathState(path);
    try {
      localStorage.setItem(DISK_PATH_STORAGE_KEY, path);
    } catch {
      // ignore
    }
  };

  // File Handle cho Web File System Access API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileHandleRef = useRef<any>(null);

  // Tính dung lượng lưu trữ và cập nhật thời gian
  const calculateStorage = useCallback((data: AppDatabase) => {
    try {
      const jsonStr = JSON.stringify(data);
      const bytes = new Blob([jsonStr]).size;
      setStorageSizeKb(Number((bytes / 1024).toFixed(1)));
    } catch {
      setStorageSizeKb(0);
    }
  }, []);

  // Tự động lưu vào IndexedDB, localStorage, Local Storage Bridge và File Handle
  const persistDatabase = useCallback(async (updated: AppDatabase) => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const dbWithMeta: AppDatabase = {
        ...updated,
        metadata: {
          ...updated.metadata,
          lastSavedAt: now.toISOString(),
          totalProjects: updated.projects.length,
        },
      };

      // 1. Lưu vào IndexedDB (Bộ nhớ Offline vĩnh viễn, không giới hạn dung lượng)
      await saveDatabaseToIdb(dbWithMeta);

      const jsonStr = JSON.stringify(dbWithMeta, null, 2);

      // 2. Lưu dự phòng vào LocalStorage (nếu còn dung lượng)
      try {
        localStorage.setItem(STORAGE_KEY, jsonStr);
      } catch (lsErr: any) {
        if (lsErr?.name === 'QuotaExceededError' || lsErr?.code === 22) {
          console.warn('LocalStorage quota limit reached. Dữ liệu đã được lưu an toàn tuyệt đối trong IndexedDB.');
        } else {
          console.error('Lỗi ghi LocalStorage:', lsErr);
        }
      }
      setLastSavedTime(timeStr);
      calculateStorage(dbWithMeta);

      // 3. Ghi trực tiếp vào file JSON trên ổ cứng máy tính vật lý qua Local Storage Bridge API
      if (diskFilePath) {
        try {
          const bridgeResult = await writeDatabaseToFileViaBridge(diskFilePath, dbWithMeta);
          if (bridgeResult.success) {
            setIsBridgeActive(true);
            setDiskFileSize(bridgeResult.sizeBytes || 0);
            setLastDiskWriteTime(timeStr);
          }
        } catch (bridgeErr) {
          console.warn('[Storage Bridge] Tự động ghi ổ đĩa thất bại:', bridgeErr);
        }
      }

      // 4. Nếu người dùng đã cấp quyền ghi vào file trên máy tính (Google Drive) qua File System Access API
      if (fileHandleRef.current) {
        try {
          const writable = await fileHandleRef.current.createWritable();
          await writable.write(jsonStr);
          await writable.close();
        } catch (fileErr) {
          console.warn('Không thể ghi tự động vào file đĩa:', fileErr);
        }
      }
    } catch (e) {
      console.error('Lỗi lưu trữ dữ liệu:', e);
    }
  }, [calculateStorage, diskFilePath]);

  // Debounce timer ref để tránh ghi đĩa quá nhiều khi database thay đổi liên tục
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lưu tự động mỗi khi database thay đổi (debounce 800ms để giảm tải ghi đĩa)
  useEffect(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      persistDatabase(database);
    }, 800);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [database, persistDatabase]);

  // Khởi động hệ thống: Bảo vệ lưu trữ bền vững, nạp từ ổ cứng / IndexedDB & kích hoạt Auto-backup hàng ngày
  useEffect(() => {
    let isMounted = true;
    const initStorageAndBackup = async () => {
      try {
        // 0. Yêu cầu quyền lưu trữ bền vững (Persistent Storage)
        requestPersistentStorage();

        // 1. Kiểm tra nạp từ file ổ đĩa máy tính trước (nếu có Bridge và file chứa dữ liệu hợp lệ)
        let loadedDb: AppDatabase | null = null;
        try {
          const checkRes = await checkFileOnDiskViaBridge(diskFilePath);
          if (checkRes.exists) {
            const readRes = await readDatabaseFromFileViaBridge(diskFilePath);
            if (readRes.success && readRes.data?.projects && readRes.data.projects.length > 0) {
              loadedDb = readRes.data;
              if (isMounted) {
                setDatabase(readRes.data);
                setIsBridgeActive(true);
                setDiskFileSize(readRes.sizeBytes || 0);
                const now = new Date();
                setLastDiskWriteTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
              }
            }
          }
        } catch (bridgeErr) {
          console.warn('[Bridge Startup] Không thể nạp từ ổ đĩa:', bridgeErr);
        }

        // 2. Nếu file ổ đĩa chưa có dữ liệu, nạp từ IndexedDB hoặc migrate từ LocalStorage
        let currentData = loadedDb;
        if (!currentData) {
          const migratedOrExisting = await autoMigrateFromLocalStorageIfEmpty(STORAGE_KEY);
          if (isMounted && migratedOrExisting && migratedOrExisting.projects && migratedOrExisting.projects.length > 0) {
            currentData = migratedOrExisting;
            setDatabase(migratedOrExisting);
          }
        }

        // 3. Nếu bộ nhớ có dự án mà file đĩa chưa có hoặc rỗng, lập tức ghi thẳng vào file đĩa!
        if (currentData && currentData.projects && currentData.projects.length > 0) {
          try {
            const diskCheck = await checkFileOnDiskViaBridge(diskFilePath);
            if (!diskCheck.exists || (diskCheck.sizeBytes && diskCheck.sizeBytes < 500)) {
              const writeRes = await writeDatabaseToFileViaBridge(diskFilePath, currentData);
              if (isMounted && writeRes.success) {
                setIsBridgeActive(true);
                setDiskFileSize(writeRes.sizeBytes || 0);
                const now = new Date();
                setLastDiskWriteTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
              }
            } else if (diskCheck.exists) {
              if (isMounted) {
                setIsBridgeActive(true);
                setDiskFileSize(diskCheck.sizeBytes || 0);
              }
            }
          } catch (e) {
            // ignore
          }
        }

        // 4. Kích hoạt Auto-backup hàng ngày (giữ 7 bản xoay vòng gần nhất)
        const todayStr = formatCustomVnDate(new Date());
        const lastAutoBackup = localStorage.getItem('projectm_last_autobackup_date');
        if (lastAutoBackup !== todayStr) {
          const backupTarget = currentData || database;
          if (backupTarget && backupTarget.projects && backupTarget.projects.length > 0) {
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            const jsonStr = JSON.stringify(backupTarget);
            const sizeKb = Number((new Blob([jsonStr]).size / 1024).toFixed(1));

            let contractCount = 0;
            Object.values(backupTarget.costPackages || {}).forEach((pkgs) => {
              contractCount += pkgs.filter((p) => p.contractNumber).length;
            });

            const snapshot: BackupSnapshotItem = {
              id: `backup_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`,
              timestamp: now.getTime(),
              dateStr: `${formatCustomVnDate(now)} ${timeStr}`,
              type: 'auto',
              note: 'Sao lưu tự động hàng ngày (Auto-backup)',
              sizeKb,
              projectCount: backupTarget.projects.length,
              contractCount,
              data: backupTarget,
            };

            await saveBackupSnapshotToIdb(snapshot);
            await pruneOldBackups(7);
            localStorage.setItem('projectm_last_autobackup_date', todayStr);
            console.log('[Auto-backup] Đã hoàn thành bản sao lưu tự động ngày:', todayStr);
          }
        }
      } catch (err) {
        console.error('Lỗi khi nạp IndexedDB hoặc Auto-backup:', err);
      }
    };

    initStorageAndBackup();
    return () => {
      isMounted = false;
    };
  }, []);

  // ==================== CÁC HÀM THAO TÁC DỰ ÁN ====================
  const addProject = (project: ProjectListItem, detail?: ProjectDetailItem) => {
    setDatabase((prev) => {
      const newProjects = [...prev.projects, project];
      const detailItem: ProjectDetailItem = detail || {
        id: `dt-${project.id}`,
        projectId: project.id,
        stt: project.stt,
        code: project.code,
        name: project.name,
        location: project.location,
        scale: '',
        status: project.status,
        group: 'Nhóm B',
        type: 'Dân dụng',
        level: 'Cấp II',
        costCompensation: 0,
        costConstruction: project.totalInvestment,
        costEquipment: 0,
        costManagement: 0,
        costConsulting: 0,
        costOthers: 0,
        costContingency: 0,
        totalInvestment: project.totalInvestment,
        approvalDecision: '',
        note: project.note,
      };

      return {
        ...prev,
        projects: newProjects,
        projectDetails: {
          ...prev.projectDetails,
          [project.id]: detailItem,
        },
      };
    });
  };

  const updateProject = (project: ProjectListItem, detail?: ProjectDetailItem) => {
    setDatabase((prev) => {
      const newProjects = prev.projects.map((p) => (p.id === project.id ? project : p));
      const newDetails = { ...prev.projectDetails };
      if (detail) {
        newDetails[project.id] = detail;
      }
      return {
        ...prev,
        projects: newProjects,
        projectDetails: newDetails,
      };
    });
  };

  const deleteProject = (projectId: string) => {
    setDatabase((prev) => {
      const newProjects = prev.projects.filter((p) => p.id !== projectId);
      const newDetails = { ...prev.projectDetails };
      delete newDetails[projectId];

      const newEstimates = { ...prev.estimates };
      delete newEstimates[projectId];

      const newCosts = { ...prev.costPackages };
      delete newCosts[projectId];

      const newInspections = { ...prev.inspections };
      delete newInspections[projectId];

      const newLegal = { ...prev.legalDocs };
      delete newLegal[projectId];

      const newPlanTasks = { ...(prev.planTasks || {}) };
      delete newPlanTasks[projectId];

       const newCostBreakdowns = { ...(prev.costBreakdowns || {}) };
      delete newCostBreakdowns[projectId];

      const newContractAppendices = { ...(prev.contractAppendices || {}) };
      delete newContractAppendices[projectId];

      return {
        ...prev,
        projects: newProjects,
        projectDetails: newDetails,
        estimates: newEstimates,
        costPackages: newCosts,
        inspections: newInspections,
        legalDocs: newLegal,
        planTasks: newPlanTasks,
        costBreakdowns: newCostBreakdowns,
        contractAppendices: newContractAppendices,
      };
    });
  };

  // ==================== CÁC HÀM THAO TÁC DỰ TOÁN ====================
  const addEstimate = (item: EstimateItem) => {
    setDatabase((prev) => {
      const currentList = prev.estimates[item.projectId] || [];
      return {
        ...prev,
        estimates: {
          ...prev.estimates,
          [item.projectId]: [...currentList, item],
        },
      };
    });
  };

  const updateEstimate = (item: EstimateItem) => {
    setDatabase((prev) => {
      const currentList = prev.estimates[item.projectId] || [];
      return {
        ...prev,
        estimates: {
          ...prev.estimates,
          [item.projectId]: currentList.map((e) => (e.id === item.id ? item : e)),
        },
      };
    });
  };

  const deleteEstimate = (projectId: string, id: string) => {
    setDatabase((prev) => {
      const currentList = prev.estimates[projectId] || [];
      return {
        ...prev,
        estimates: {
          ...prev.estimates,
          [projectId]: currentList.filter((e) => e.id !== id),
        },
      };
    });
  };

  // ==================== CÁC HÀM THAO TÁC CHI PHÍ / HỢP ĐỒNG ====================
  const addCostPackage = (item: CostPackageItem) => {
    setDatabase((prev) => {
      const currentList = prev.costPackages[item.projectId] || [];
      return {
        ...prev,
        costPackages: {
          ...prev.costPackages,
          [item.projectId]: [...currentList, item],
        },
      };
    });
  };

  const updateCostPackage = (item: CostPackageItem) => {
    setDatabase((prev) => {
      const currentList = prev.costPackages[item.projectId] || [];
      return {
        ...prev,
        costPackages: {
          ...prev.costPackages,
          [item.projectId]: currentList.map((c) => (c.id === item.id ? item : c)),
        },
      };
    });
  };

  const deleteCostPackage = (projectId: string, id: string) => {
    setDatabase((prev) => {
      const currentList = prev.costPackages[projectId] || [];
      const targetPackage = currentList.find((c) => c.id === id);
      const targetName = targetPackage?.content.trim();

      // Ràng buộc toàn vẹn: Tự động xóa luôn các đợt nghiệm thu liên quan đến gói thầu này
      const currentInspections = prev.inspections[projectId] || [];
      const updatedInspections = currentInspections.filter((insp) => {
        if (insp.costPackageId && insp.costPackageId === id) return false;
        if (targetName && insp.packageName?.trim() === targetName) return false;
        return true;
      });

      // Ràng buộc toàn vẹn: Tự động xóa luôn các phụ lục hợp đồng liên quan đến gói thầu này
      const currentAppendices = prev.contractAppendices?.[projectId] || [];
      const updatedAppendices = currentAppendices.filter((app) => app.costPackageId !== id);

      return {
        ...prev,
        costPackages: {
          ...prev.costPackages,
          [projectId]: currentList.filter((c) => c.id !== id),
        },
        inspections: {
          ...prev.inspections,
          [projectId]: updatedInspections,
        },
        contractAppendices: {
          ...(prev.contractAppendices || {}),
          [projectId]: updatedAppendices,
        },
      };
    });
  };

  // ==================== CÁC HÀM THAO TÁC CHI TIẾT CẤU THÀNH 7 LOẠI CHI PHÍ ====================
  const saveCostBreakdowns = (
    projectId: string,
    parentId: string,
    costCategory: SevenCostCategory,
    items: CostBreakdownItem[]
  ): number => {
    let totalSum = 0;
    items.forEach((item) => {
      totalSum += Number(item.amount) || 0;
    });

    setDatabase((prev) => {
      const currentList = prev.costBreakdowns?.[projectId] || [];
      // Lọc bỏ các khoản mục cũ của cùng parentId và cùng costCategory
      const remaining = currentList.filter(
        (b) => !(b.parentId === parentId && b.costCategory === costCategory)
      );
      return {
        ...prev,
        costBreakdowns: {
          ...(prev.costBreakdowns || {}),
          [projectId]: [...remaining, ...items],
        },
      };
    });

    return totalSum;
  };

  // ==================== CÁC HÀM THAO TÁC PHỤ LỤC HỢP ĐỒNG (PLHĐ) ====================
  const getContractAppendicesByPackage = useCallback(
    (projectId: string, costPackageId: string): ContractAppendixItem[] => {
      const list = database.contractAppendices?.[projectId] || [];
      return list
        .filter((item) => item.costPackageId === costPackageId)
        .sort((a, b) => a.stt - b.stt);
    },
    [database.contractAppendices]
  );

  const getEffectiveContractValue = useCallback(
    (projectId: string, costPackageId: string): number => {
      const packageList = database.costPackages[projectId] || [];
      const targetPackage = packageList.find((p) => p.id === costPackageId);
      const originalValue = Number(targetPackage?.contractValue) || 0;
      const appendices = getContractAppendicesByPackage(projectId, costPackageId);
      const totalAdjustment = appendices.reduce(
        (sum, item) => sum + (Number(item.adjustmentAmount) || 0),
        0
      );
      return originalValue + totalAdjustment;
    },
    [database.costPackages, getContractAppendicesByPackage]
  );

  const saveContractAppendix = (appendix: ContractAppendixItem) => {
    setDatabase((prev) => {
      const currentList = prev.contractAppendices?.[appendix.projectId] || [];
      const exists = currentList.some((item) => item.id === appendix.id);
      let updated: ContractAppendixItem[];
      if (exists) {
        updated = currentList.map((item) => (item.id === appendix.id ? appendix : item));
      } else {
        updated = [...currentList, appendix];
      }
      return {
        ...prev,
        contractAppendices: {
          ...(prev.contractAppendices || {}),
          [appendix.projectId]: updated,
        },
      };
    });
  };

  const deleteContractAppendix = (projectId: string, appendixId: string) => {
    setDatabase((prev) => {
      const currentList = prev.contractAppendices?.[projectId] || [];
      return {
        ...prev,
        contractAppendices: {
          ...(prev.contractAppendices || {}),
          [projectId]: currentList.filter((item) => item.id !== appendixId),
        },
      };
    });
  };

  // ==================== CÁC HÀM THAO TÁC NGHIỆM THU ====================
  const addInspection = (item: InspectionItem) => {
    setDatabase((prev) => {
      const currentList = prev.inspections[item.projectId] || [];
      return {
        ...prev,
        inspections: {
          ...prev.inspections,
          [item.projectId]: [...currentList, item],
        },
      };
    });
  };

  const updateInspection = (item: InspectionItem) => {
    setDatabase((prev) => {
      const currentList = prev.inspections[item.projectId] || [];
      return {
        ...prev,
        inspections: {
          ...prev.inspections,
          [item.projectId]: currentList.map((i) => (i.id === item.id ? item : i)),
        },
      };
    });
  };

  const deleteInspection = (projectId: string, id: string) => {
    setDatabase((prev) => {
      const currentList = prev.inspections[projectId] || [];
      return {
        ...prev,
        inspections: {
          ...prev.inspections,
          [projectId]: currentList.filter((i) => i.id !== id),
        },
      };
    });
  };

  // ==================== CÁC HÀM THAO TÁC PHÁP LÝ ====================
  const addLegalDoc = (item: LegalDocItem) => {
    setDatabase((prev) => {
      const currentList = prev.legalDocs[item.projectId] || [];
      return {
        ...prev,
        legalDocs: {
          ...prev.legalDocs,
          [item.projectId]: [...currentList, item],
        },
      };
    });
  };

  const updateLegalDoc = (item: LegalDocItem) => {
    setDatabase((prev) => {
      const currentList = prev.legalDocs[item.projectId] || [];
      return {
        ...prev,
        legalDocs: {
          ...prev.legalDocs,
          [item.projectId]: currentList.map((l) => (l.id === item.id ? item : l)),
        },
      };
    });
  };

  const deleteLegalDoc = (projectId: string, id: string) => {
    setDatabase((prev) => {
      const currentList = prev.legalDocs[projectId] || [];
      return {
        ...prev,
        legalDocs: {
          ...prev.legalDocs,
          [projectId]: currentList.filter((l) => l.id !== id),
        },
      };
    });
  };

  // ==================== CÁC HÀM THAO TÁC KẾ HOẠCH DỰ ÁN (TAB 6) ====================
  const addPlanTask = (item: PlanTaskItem) => {
    setDatabase((prev) => {
      const currentList = prev.planTasks?.[item.projectId] || [];
      return {
        ...prev,
        planTasks: {
          ...(prev.planTasks || {}),
          [item.projectId]: [...currentList, item],
        },
      };
    });
  };

  const updatePlanTask = (item: PlanTaskItem) => {
    setDatabase((prev) => {
      const currentList = prev.planTasks?.[item.projectId] || [];
      return {
        ...prev,
        planTasks: {
          ...(prev.planTasks || {}),
          [item.projectId]: currentList.map((t) => (t.id === item.id ? item : t)),
        },
      };
    });
  };

  const deletePlanTask = (projectId: string, id: string) => {
    setDatabase((prev) => {
      const currentList = prev.planTasks?.[projectId] || [];
      return {
        ...prev,
        planTasks: {
          ...(prev.planTasks || {}),
          [projectId]: currentList.filter((t) => t.id !== id),
        },
      };
    });
  };

  // ==================== CÁC HÀM THAO TÁC CÔNG TY ====================
  const addCompany = (item: CompanyInfo) => {
    setDatabase((prev) => ({
      ...prev,
      companies: [...prev.companies, item],
    }));
  };

  const updateCompany = (item: CompanyInfo) => {
    setDatabase((prev) => ({
      ...prev,
      companies: prev.companies.map((c) => (c.id === item.id ? item : c)),
    }));
  };

  const deleteCompany = (id: string) => {
    setDatabase((prev) => ({
      ...prev,
      companies: prev.companies.filter((c) => c.id !== id),
    }));
  };

  // ==================== SAO LƯU & XUẤT FILE JSON ====================
  const exportDatabaseToJson = async (filename = 'du_lieu_du_an.json') => {
    try {
      // Lấy dữ liệu soạn thảo văn bản từ IndexedDB
      const draftingData = await loadDraftingFromIdb();

      const exportData: AppDatabase = {
        ...database,
        metadata: {
          ...database.metadata,
          exportedAt: new Date().toISOString(),
          lastSavedAt: new Date().toISOString(),
          totalProjects: database.projects.length,
        },
        drafting: draftingData,
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Lỗi xuất file dữ liệu JSON:', e);
    }
  };

  // ==================== PHỤC HỒI / NẠP FILE JSON ====================
  const importDatabaseFromJson = (file: File): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          // Kiểm tra cấu trúc cơ bản
          if (!parsed.projects || !Array.isArray(parsed.projects)) {
            resolve({
              success: false,
              message: 'File không đúng định dạng cơ sở dữ liệu ProjectM (thiếu danh mục projects).',
            });
            return;
          }

          const validDatabase: AppDatabase = {
            metadata: parsed.metadata || {
              version: APP_VERSION,
              appName: 'ProjectM',
              exportedAt: new Date().toISOString(),
              lastSavedAt: new Date().toISOString(),
              totalProjects: parsed.projects.length,
            },
            projects: parsed.projects,
            projectDetails: parsed.projectDetails || {},
            estimates: parsed.estimates || {},
            costPackages: parsed.costPackages || {},
            inspections: parsed.inspections || {},
            legalDocs: parsed.legalDocs || {},
            companies: parsed.companies || [],
            planTasks: parsed.planTasks || {},
            costBreakdowns: parsed.costBreakdowns || {},
            contractAppendices: parsed.contractAppendices || {},
          };

          setDatabase(validDatabase);

          // Nạp dữ liệu soạn thảo văn bản (nếu có) vào IndexedDB
          if (parsed.drafting) {
            await saveDraftingToIdb(parsed.drafting);
          }

          resolve({
            success: true,
            message: `Nạp thành công ${validDatabase.projects.length} dự án từ file ${file.name}.`,
          });
        } catch (err) {
          resolve({
            success: false,
            message: `Lỗi đọc file JSON: ${err instanceof Error ? err.message : 'Dữ liệu không hợp lệ'}`,
          });
        }
      };
      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Không thể đọc file từ thiết bị.',
        });
      };
      reader.readAsText(file);
    });
  };

  // ==================== KHÔI PHỤC DỮ LIỆU GỐC ====================
  const resetDatabaseToDefaults = () => {
    const defaults = getDefaultDatabase();
    setDatabase(defaults);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults, null, 2));
  };

  // ==================== CHỌN THƯ MỤC LƯU FILE TRỰC TIẾP (DIRECTORY PICKER) ====================
  const selectSaveDirectory = async (): Promise<{ success: boolean; message: string; dirName?: string }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowAny = window as any;
    if (!windowAny.showDirectoryPicker) {
      return {
        success: false,
        message: 'Trình duyệt chưa hỗ trợ chọn thư mục trực tiếp. Bạn hãy dùng nút "Lưu vị trí mới (Save As)".',
      };
    }

    try {
      const dirHandle = await windowAny.showDirectoryPicker({
        mode: 'readwrite',
      });

      // Tạo hoặc ghi đè file du_lieu_du_an.json trong thư mục được chọn
      const fileHandle = await dirHandle.getFileHandle('du_lieu_du_an.json', { create: true });
      
      const now = new Date();
      const dbWithMeta: AppDatabase = {
        ...database,
        metadata: {
          ...database.metadata,
          lastSavedAt: now.toISOString(),
          totalProjects: database.projects.length,
        },
      };
      const jsonStr = JSON.stringify(dbWithMeta, null, 2);

      const writable = await fileHandle.createWritable();
      await writable.write(jsonStr);
      await writable.close();

      fileHandleRef.current = fileHandle;
      setIsDirectFileConnected(true);
      setConnectedFileName(`Thư mục [${dirHandle.name}]/du_lieu_du_an.json`);

      return {
        success: true,
        message: `Đã chọn thư mục "${dirHandle.name}" và lưu thành công file du_lieu_du_an.json! Mọi thay đổi từ nay sẽ tự động đồng bộ vào thư mục này.`,
        dirName: dirHandle.name,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, message: 'Đã hủy chọn thư mục.' };
      }
      return {
        success: false,
        message: `Lỗi truy cập thư mục: ${err instanceof Error ? err.message : 'Thao tác không thành công'}`,
      };
    }
  };

  // ==================== LƯU FILE TẠI VỊ TRÍ TÙY CHỌN (SAVE AS) ====================
  const saveDatabaseAs = async (): Promise<{ success: boolean; message: string; fileName?: string }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowAny = window as any;
    if (!windowAny.showSaveFilePicker) {
      exportDatabaseToJson('du_lieu_du_an.json');
      return {
        success: true,
        message: 'Đã tải file du_lieu_du_an.json về máy tính.',
        fileName: 'du_lieu_du_an.json',
      };
    }

    try {
      const handle = await windowAny.showSaveFilePicker({
        suggestedName: 'du_lieu_du_an.json',
        types: [
          {
            description: 'File Dữ Liệu ProjectM (JSON)',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });

      const now = new Date();
      const dbWithMeta: AppDatabase = {
        ...database,
        metadata: {
          ...database.metadata,
          lastSavedAt: now.toISOString(),
          totalProjects: database.projects.length,
        },
      };
      const jsonStr = JSON.stringify(dbWithMeta, null, 2);

      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();

      fileHandleRef.current = handle;
      setIsDirectFileConnected(true);
      setConnectedFileName(handle.name);

      return {
        success: true,
        message: `Đã lưu file "${handle.name}" thành công! Mọi thay đổi tiếp theo sẽ tự động ghi nhớ vào file này.`,
        fileName: handle.name,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, message: 'Đã hủy chọn vị trí lưu file.' };
      }
      return {
        success: false,
        message: `Lỗi lưu file: ${err instanceof Error ? err.message : 'Thao tác không thành công'}`,
      };
    }
  };

  // ==================== KẾT NỐI FILE TRỰC TIẾP TRÊN ĐĨA (FILE SYSTEM ACCESS API) ====================
  const connectDirectFile = async (): Promise<{ success: boolean; message: string }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowAny = window as any;
    if (!windowAny.showOpenFilePicker) {
      return {
        success: false,
        message: 'Trình duyệt hiện tại chưa hỗ trợ File System Access API. Bạn hãy dùng tính năng Xuất/Nạp file JSON thông thường.',
      };
    }

    try {
      const [handle] = await windowAny.showOpenFilePicker({
        types: [
          {
            description: 'File JSON Database',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      const content = await file.text();
      const parsed = JSON.parse(content);

      if (parsed.projects && Array.isArray(parsed.projects)) {
        fileHandleRef.current = handle;
        setDatabase(parsed);
        setIsDirectFileConnected(true);
        setConnectedFileName(file.name);

        return {
          success: true,
          message: `Đã kết nối trực tiếp với file "${file.name}". Mọi thay đổi sẽ tự động ghi thẳng vào file này!`,
        };
      } else {
        return {
          success: false,
          message: 'File được chọn không đúng định dạng dữ liệu ProjectM.',
        };
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, message: 'Đã hủy chọn file.' };
      }
      return {
        success: false,
        message: `Lỗi kết nối file: ${err instanceof Error ? err.message : 'Thao tác không thành công'}`,
      };
    }
  };

  const disconnectDirectFile = () => {
    fileHandleRef.current = null;
    setIsDirectFileConnected(false);
  };

  // ==================== GHI ĐÈ DỮ LIỆU HIỆN TẠI VÀO FILE TRÊN MÁY & BẬT ĐỒNG BỘ ====================
  const writeCurrentDataToSelectedFile = async (): Promise<{ success: boolean; message: string; fileName?: string }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowAny = window as any;
    if (!windowAny.showOpenFilePicker) {
      return {
        success: false,
        message: 'Trình duyệt hiện tại chưa hỗ trợ File System Access API. Bạn hãy dùng tính năng "Tải file JSON về máy".',
      };
    }

    try {
      const [handle] = await windowAny.showOpenFilePicker({
        types: [
          {
            description: 'File JSON Database',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
        multiple: false,
      });

      const now = new Date();
      const dbWithMeta: AppDatabase = {
        ...database,
        metadata: {
          ...database.metadata,
          lastSavedAt: now.toISOString(),
          totalProjects: database.projects.length,
        },
      };
      const jsonStr = JSON.stringify(dbWithMeta, null, 2);

      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();

      fileHandleRef.current = handle;
      setIsDirectFileConnected(true);
      setConnectedFileName(handle.name);

      return {
        success: true,
        message: `Đã ghi thành công ${database.projects.length} dự án vào file "${handle.name}". Từ nay, mọi thay đổi trên phần mềm sẽ tự động cập nhật vào file này!`,
        fileName: handle.name,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, message: 'Đã hủy chọn file.' };
      }
      return {
        success: false,
        message: `Lỗi ghi file: ${err instanceof Error ? err.message : 'Thao tác không thành công'}`,
      };
    }
  };

  const forceWriteToCurrentFile = async (): Promise<{ success: boolean; message: string }> => {
    if (!fileHandleRef.current) {
      return {
        success: false,
        message: 'Chưa kết nối với file nào trên máy tính.',
      };
    }

    try {
      const now = new Date();
      const dbWithMeta: AppDatabase = {
        ...database,
        metadata: {
          ...database.metadata,
          lastSavedAt: now.toISOString(),
          totalProjects: database.projects.length,
        },
      };
      const jsonStr = JSON.stringify(dbWithMeta, null, 2);

      const writable = await fileHandleRef.current.createWritable();
      await writable.write(jsonStr);
      await writable.close();

      return {
        success: true,
        message: `Đã đồng bộ lại toàn bộ dữ liệu vào file "${connectedFileName}" thành công!`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Lỗi khi ghi file: ${err instanceof Error ? err.message : 'Không thể ghi file'}`,
      };
    }
  };

  // ==================== CÁC HÀM QUẢN LÝ SAO LƯU DỰ PHÒNG (INDEXEDDB BACKUP) ====================
  const createManualBackup = async (note?: string): Promise<boolean> => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const jsonStr = JSON.stringify(database);
      const sizeKb = Number((new Blob([jsonStr]).size / 1024).toFixed(1));

      let contractCount = 0;
      Object.values(database.costPackages || {}).forEach((pkgs) => {
        contractCount += pkgs.filter((p) => p.contractNumber).length;
      });

      const snapshot: BackupSnapshotItem = {
        id: `manual_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`,
        timestamp: now.getTime(),
        dateStr: `${formatCustomVnDate(now)} ${timeStr}`,
        type: 'manual',
        note: note || 'Bản sao lưu thủ công của người dùng',
        sizeKb,
        projectCount: database.projects.length,
        contractCount,
        data: database,
      };

      const success = await saveBackupSnapshotToIdb(snapshot);
      await pruneOldBackups(15);
      return success;
    } catch (e) {
      console.error('Lỗi tạo sao lưu thủ công:', e);
      return false;
    }
  };

  const restoreFromBackup = async (backupItem: BackupSnapshotItem): Promise<boolean> => {
    try {
      if (!backupItem || !backupItem.data || !backupItem.data.projects) {
        return false;
      }
      setDatabase(backupItem.data);
      await saveDatabaseToIdb(backupItem.data);
      return true;
    } catch (e) {
      console.error('Lỗi khôi phục từ bản sao lưu:', e);
      return false;
    }
  };

  const getBackupList = async (): Promise<BackupSnapshotItem[]> => {
    return await getBackupSnapshotsFromIdb();
  };

  const deleteBackup = async (backupId: string): Promise<boolean> => {
    return await deleteBackupSnapshotFromIdb(backupId);
  };

  // ==================== CÁC HÀM ĐỒNG BỘ Ổ CỨNG VẬT LÝ (LOCAL STORAGE BRIDGE) ====================
  const syncNowToDisk = async (customPath?: string): Promise<{ success: boolean; message: string; filePath?: string }> => {
    const targetPath = customPath || diskFilePath;
    const now = new Date();
    const dbWithMeta: AppDatabase = {
      ...database,
      metadata: {
        ...database.metadata,
        lastSavedAt: now.toISOString(),
        totalProjects: database.projects.length,
      },
    };

    const res = await writeDatabaseToFileViaBridge(targetPath, dbWithMeta);
    if (res.success) {
      setIsBridgeActive(true);
      setDiskFileSize(res.sizeBytes || 0);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastDiskWriteTime(timeStr);
      return {
        success: true,
        message: `Đã ghi thành công ${database.projects.length} dự án vào file "${res.filePath || targetPath}".`,
        filePath: res.filePath || targetPath,
      };
    }
    return {
      success: false,
      message: res.message || 'Lỗi ghi file vào ổ đĩa.',
    };
  };

  const reloadFromDisk = async (customPath?: string): Promise<{ success: boolean; message: string }> => {
    const targetPath = customPath || diskFilePath;
    const res = await readDatabaseFromFileViaBridge(targetPath);
    if (res.success && res.data && Array.isArray(res.data.projects)) {
      setDatabase(res.data);
      setIsBridgeActive(true);
      setDiskFileSize(res.sizeBytes || 0);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastDiskWriteTime(timeStr);
      return {
        success: true,
        message: `Đã nạp thành công ${res.data.projects.length} dự án từ file "${res.filePath || targetPath}".`,
      };
    }
    return {
      success: false,
      message: res.message || 'Không thể nạp dữ liệu từ file ổ đĩa.',
    };
  };

  return (
    <DataContext.Provider
      value={{
        projects: database.projects,
        projectDetails: database.projectDetails,
        estimates: database.estimates,
        costPackages: database.costPackages,
        inspections: database.inspections,
        legalDocs: database.legalDocs,
        companies: database.companies,
        planTasks: database.planTasks || {},
        costBreakdowns: database.costBreakdowns || {},
        contractAppendices: database.contractAppendices || {},
        lastSavedTime,
        storageSizeKb,
        isDirectFileConnected,
        connectedFileName,
        diskFilePath,
        setDiskFilePath,
        isBridgeActive,
        lastDiskWriteTime,
        diskFileSize,
        syncNowToDisk,
        reloadFromDisk,
        addProject,
        updateProject,
        deleteProject,
        addEstimate,
        updateEstimate,
        deleteEstimate,
        saveCostBreakdowns,
        addCostPackage,
        updateCostPackage,
        deleteCostPackage,
        saveContractAppendix,
        deleteContractAppendix,
        getContractAppendicesByPackage,
        getEffectiveContractValue,
        addInspection,
        updateInspection,
        deleteInspection,
        addLegalDoc,
        updateLegalDoc,
        deleteLegalDoc,
        addPlanTask,
        updatePlanTask,
        deletePlanTask,
        addCompany,
        updateCompany,
        deleteCompany,
        exportDatabaseToJson,
        importDatabaseFromJson,
        resetDatabaseToDefaults,
        selectSaveDirectory,
        saveDatabaseAs,
        connectDirectFile,
        disconnectDirectFile,
        writeCurrentDataToSelectedFile,
        forceWriteToCurrentFile,
        createManualBackup,
        restoreFromBackup,
        getBackupList,
        deleteBackup,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

