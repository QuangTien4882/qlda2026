import React, { useState } from 'react';
import { Save, FolderOpen, Trash2, Clock, FileText, ChevronDown, ChevronUp, Edit3, Check, X } from 'lucide-react';
import { DraftDocument, TemplateVariable, JVMember } from '../../../../types/drafting';
import { generateId } from '../../../../utils/docxUtils';

interface DraftSaveLoadPanelProps {
  /** Danh sách bản thảo đã lưu */
  draftDocuments: DraftDocument[];
  /** Template ID hiện tại */
  selectedTemplateId: string | null;
  /** Project ID hiện tại */
  selectedProjectId: string;
  /** Biến hiện tại */
  draftVariables: TemplateVariable[];
  /** Thành viên liên danh hiện tại */
  jvMembers: JVMember[];
  /** Tên template hiện tại */
  templateName?: string;
  /** Tên dự án hiện tại */
  projectName?: string;
  /** Lưu bản thảo */
  onSaveDraft: (draft: DraftDocument) => void;
  /** Xóa bản thảo */
  onDeleteDraft: (id: string) => void;
  /** Tải bản thảo (restore variables + jvMembers) */
  onLoadDraft: (draft: DraftDocument) => void;
}

export const DraftSaveLoadPanel: React.FC<DraftSaveLoadPanelProps> = ({
  draftDocuments,
  selectedTemplateId,
  selectedProjectId,
  draftVariables,
  jvMembers,
  templateName,
  projectName,
  onSaveDraft,
  onDeleteDraft,
  onLoadDraft,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Lọc bản thảo theo template hiện tại
  const relatedDrafts = draftDocuments.filter(d => d.templateId === selectedTemplateId);

  const handleSaveNew = () => {
    if (!selectedTemplateId || !saveName.trim()) return;

    const draft: DraftDocument = {
      id: generateId('draft'),
      templateId: selectedTemplateId,
      projectId: selectedProjectId,
      name: saveName.trim(),
      variables: draftVariables.map(v => ({ ...v })),
      jvMembers: jvMembers.length > 0 ? jvMembers.map(m => ({ ...m })) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveDraft(draft);
    setSaveName('');
    setIsSaving(false);
  };

  const handleOverwrite = (existingDraft: DraftDocument) => {
    if (!confirm(`Ghi đè bản thảo "${existingDraft.name}"?`)) return;

    const updated: DraftDocument = {
      ...existingDraft,
      projectId: selectedProjectId,
      variables: draftVariables.map(v => ({ ...v })),
      jvMembers: jvMembers.length > 0 ? jvMembers.map(m => ({ ...m })) : undefined,
      updatedAt: new Date().toISOString(),
    };

    onSaveDraft(updated);
  };

  const handleRename = (draft: DraftDocument) => {
    if (!renameValue.trim()) return;
    onSaveDraft({ ...draft, name: renameValue.trim(), updatedAt: new Date().toISOString() });
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = (draft: DraftDocument) => {
    if (!confirm(`Xóa bản thảo "${draft.name}"?`)) return;
    onDeleteDraft(draft.id);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return iso;
    }
  };

  if (!selectedTemplateId) return null;

  return (
    <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-1.5">
          <FolderOpen size={13} className="text-amber-400" />
          <span className="text-[10px] text-slate-500 uppercase font-bold">
            Bản thảo đã lưu
          </span>
          {relatedDrafts.length > 0 && (
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
              {relatedDrafts.length}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* Save new draft */}
          {isSaving ? (
            <div className="flex gap-1.5">
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder={`${templateName || 'Mẫu'} - ${projectName || 'Dự án'}`}
                className="flex-1 bg-[#080d1a] border border-[#232f4e] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSaveNew(); if (e.key === 'Escape') setIsSaving(false); }}
              />
              <button
                onClick={handleSaveNew}
                disabled={!saveName.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white disabled:opacity-40"
              >
                <Check size={13} />
              </button>
              <button onClick={() => setIsSaving(false)} className="px-2 py-1.5 rounded-lg border border-[#232f4e] text-slate-500 hover:text-slate-300">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setSaveName(`${templateName || 'Mẫu'} - ${projectName || 'Dự án'}`);
                setIsSaving(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 text-xs font-semibold text-emerald-300 transition-colors"
            >
              <Save size={13} /> Lưu bản thảo mới
            </button>
          )}

          {/* Draft list */}
          {relatedDrafts.length === 0 ? (
            <p className="text-[10px] text-slate-600 text-center py-2 italic">Chưa có bản thảo nào cho mẫu này.</p>
          ) : (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {relatedDrafts
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map(draft => (
                  <div
                    key={draft.id}
                    className="p-2 bg-[#080d1a] border border-[#232f4e] rounded-lg group hover:border-blue-500/30 transition-colors"
                  >
                    {renamingId === draft.id ? (
                      <div className="flex gap-1.5">
                        <input
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          className="flex-1 bg-[#0c1424] border border-blue-500/40 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') handleRename(draft); if (e.key === 'Escape') setRenamingId(null); }}
                        />
                        <button onClick={() => handleRename(draft)} className="text-emerald-400 hover:text-emerald-300 p-1"><Check size={12} /></button>
                        <button onClick={() => setRenamingId(null)} className="text-slate-500 hover:text-slate-300 p-1"><X size={12} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <FileText size={13} className="text-blue-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-slate-200 truncate">{draft.name}</p>
                            <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock size={9} /> {formatDate(draft.updatedAt)}
                              {draft.variables?.filter(v => v.value).length > 0 && (
                                <span className="ml-1">· {draft.variables.filter(v => v.value).length} biến đã điền</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onLoadDraft(draft)}
                            className="flex-1 px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-[10px] font-semibold text-blue-300 transition-colors"
                          >
                            Tải lại
                          </button>
                          <button
                            onClick={() => handleOverwrite(draft)}
                            className="flex-1 px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-[10px] font-semibold text-amber-300 transition-colors"
                          >
                            Ghi đè
                          </button>
                          <button
                            onClick={() => { setRenamingId(draft.id); setRenameValue(draft.name); }}
                            className="px-1.5 py-1 rounded bg-slate-700/30 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <Edit3 size={10} />
                          </button>
                          <button
                            onClick={() => handleDelete(draft)}
                            className="px-1.5 py-1 rounded bg-red-600/10 hover:bg-red-600/20 text-red-500/60 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

