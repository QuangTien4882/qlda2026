import React from 'react';
import { FolderPlus, Trash2 } from 'lucide-react';
import { TemplateFolder } from '../../../../types/drafting';

interface TemplateFolderSidebarProps {
  folders: TemplateFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onAddFolder: () => void;
  onDeleteFolder: (id: string) => void;
}

export const TemplateFolderSidebar: React.FC<TemplateFolderSidebarProps> = ({
  folders, selectedFolderId, onSelectFolder, onAddFolder, onDeleteFolder,
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Thư mục</span>
      <button onClick={onAddFolder} className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/10" title="Tạo thư mục mới">
        <FolderPlus size={14} />
      </button>
    </div>
    <button
      onClick={() => onSelectFolder(null)}
      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedFolderId === null ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
    >
      📁 Tất cả mẫu
    </button>
    {folders.map(f => (
      <div key={f.id} className="group flex items-center">
        <button
          onClick={() => onSelectFolder(f.id)}
          className={`flex-1 text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors truncate ${selectedFolderId === f.id ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          📂 {f.name}
        </button>
        <button
          onClick={() => onDeleteFolder(f.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0"
          title="Xóa thư mục"
        >
          <Trash2 size={12} />
        </button>
      </div>
    ))}
  </div>
);

