import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  TemplateFolder,
  DocTemplate,
  DraftDocument,
  TemplateVariable,
  JVMember,
  DraftingDatabase,
} from '../types/drafting';
import { saveDraftingToIdb, loadDraftingFromIdb } from '../services/storage/idbService';
import { generateId } from '../utils/docxUtils';

interface DraftingContextType {
  // Dữ liệu
  templateFolders: TemplateFolder[];
  docTemplates: DocTemplate[];
  draftDocuments: DraftDocument[];

  // Thao tác Thư mục
  addFolder: (name: string) => TemplateFolder;
  deleteFolder: (id: string) => void;

  // Thao tác Template
  addTemplate: (template: DocTemplate) => void;
  updateTemplate: (template: DocTemplate) => void;
  deleteTemplate: (id: string) => void;

  // Thao tác Bản thảo
  saveDraft: (draft: DraftDocument) => void;
  deleteDraft: (id: string) => void;

  // Export/Import cho JSON backup
  exportDraftingData: () => DraftingDatabase;
  importDraftingData: (data: DraftingDatabase) => void;

  // Trạng thái đang soạn thảo có dữ liệu chưa lưu (dùng để cảnh báo khi thoát trang)
  isDraftingDirty: boolean;
  setIsDraftingDirty: (dirty: boolean) => void;
}

const DraftingContext = createContext<DraftingContextType | undefined>(undefined);

export const DraftingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [templateFolders, setTemplateFolders] = useState<TemplateFolder[]>([]);
  const [docTemplates, setDocTemplates] = useState<DocTemplate[]>([]);
  const [draftDocuments, setDraftDocuments] = useState<DraftDocument[]>([]);
  const [isDraftingDirty, setIsDraftingDirty] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Debounce timer ref để tránh ghi IDB quá nhiều
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nạp dữ liệu từ IndexedDB khi khởi tạo
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadDraftingFromIdb();
        setTemplateFolders(data.templateFolders || []);
        setDocTemplates(data.docTemplates || []);
        setDraftDocuments(data.draftDocuments || []);
      } catch (e) {
        console.error('[DraftingContext] Lỗi nạp dữ liệu soạn thảo:', e);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Auto-save vào IndexedDB khi dữ liệu thay đổi (debounce 500ms)
  const persistData = useCallback(async () => {
    const data: DraftingDatabase = {
      templateFolders,
      docTemplates,
      draftDocuments,
    };
    await saveDraftingToIdb(data);
  }, [templateFolders, docTemplates, draftDocuments]);

  useEffect(() => {
    if (!isLoaded) return; // Không persist khi chưa load xong (tránh ghi đè rỗng)
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistData();
    }, 500);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [templateFolders, docTemplates, draftDocuments, isLoaded, persistData]);

  // ==================== THAO TÁC THƯ MỤC ====================
  const addFolder = (name: string): TemplateFolder => {
    const folder: TemplateFolder = {
      id: generateId('folder'),
      name,
      createdAt: new Date().toISOString(),
    };
    setTemplateFolders(prev => [...prev, folder]);
    return folder;
  };

  const deleteFolder = (id: string) => {
    setTemplateFolders(prev => prev.filter(f => f.id !== id));
    // Chuyển templates của folder bị xóa sang "Không phân loại" (folderId = '')
    setDocTemplates(prev => prev.map(t => t.folderId === id ? { ...t, folderId: '' } : t));
  };

  // ==================== THAO TÁC TEMPLATE ====================
  const addTemplate = (template: DocTemplate) => {
    setDocTemplates(prev => [...prev, template]);
  };

  const updateTemplate = (template: DocTemplate) => {
    setDocTemplates(prev => prev.map(t => t.id === template.id ? template : t));
  };

  const deleteTemplate = (id: string) => {
    setDocTemplates(prev => prev.filter(t => t.id !== id));
    // Xóa luôn bản thảo liên quan
    setDraftDocuments(prev => prev.filter(d => d.templateId !== id));
  };

  // ==================== THAO TÁC BẢN THẢO ====================
  const saveDraft = (draft: DraftDocument) => {
    setDraftDocuments(prev => {
      const exists = prev.some(d => d.id === draft.id);
      if (exists) {
        return prev.map(d => d.id === draft.id ? draft : d);
      }
      return [...prev, draft];
    });
  };

  const deleteDraft = (id: string) => {
    setDraftDocuments(prev => prev.filter(d => d.id !== id));
  };

  // ==================== EXPORT/IMPORT CHO JSON BACKUP ====================
  const exportDraftingData = (): DraftingDatabase => ({
    templateFolders,
    docTemplates,
    draftDocuments,
  });

  const importDraftingData = (data: DraftingDatabase) => {
    if (data.templateFolders) setTemplateFolders(data.templateFolders);
    if (data.docTemplates) setDocTemplates(data.docTemplates);
    if (data.draftDocuments) setDraftDocuments(data.draftDocuments);
  };

  return (
    <DraftingContext.Provider
      value={{
        templateFolders,
        docTemplates,
        draftDocuments,
        addFolder,
        deleteFolder,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        saveDraft,
        deleteDraft,
        exportDraftingData,
        importDraftingData,
        isDraftingDirty,
        setIsDraftingDirty,
      }}
    >
      {children}
    </DraftingContext.Provider>
  );
};

export const useDrafting = () => {
  const context = useContext(DraftingContext);
  if (!context) {
    throw new Error('useDrafting must be used within a DraftingProvider');
  }
  return context;
};

