import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileEdit, FolderPlus, Upload, Trash2, FileText, Search, ChevronDown, Save, Download, Plus, Eye, X, Settings2, Loader2 } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';
import { useDrafting } from '../../../context/DraftingContext';
import { DocTemplate, TemplateVariable, TemplateFolder, JVMember } from '../../../types/drafting';
import { generateId, arrayBufferToBase64, base64ToArrayBuffer, numberToWordsVN, formatVNDateString, encodeXML, findPlainTextInXml } from '../../../utils/docxUtils';
import { formatVnNumber, parseVnNumber } from '../../../utils/numberUtils';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { renderAsync } from 'docx-preview';
import { saveAs } from 'file-saver';

// ==================== SUB-COMPONENTS ====================

/** Sidebar thư mục template */
const TemplateFolderSidebar: React.FC<{
  folders: TemplateFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onAddFolder: () => void;
  onDeleteFolder: (id: string) => void;
}> = ({ folders, selectedFolderId, onSelectFolder, onAddFolder, onDeleteFolder }) => (
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

/** Variable Config Dialog - Cấu hình biến khi admin bôi đen text */
const VariableConfigDialog: React.FC<{
  isOpen: boolean;
  selectedText: string;
  onSave: (variable: Partial<TemplateVariable>) => void;
  onClose: () => void;
}> = ({ isOpen, selectedText, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<TemplateVariable['type']>('text');
  const [optionsStr, setOptionsStr] = useState('');
  const [sourceVariableId, setSourceVariableId] = useState('');
  const [dependentConfig, setDependentConfig] = useState('');
  const [formulaExpression, setFormulaExpression] = useState('');
  const [jvField, setJvField] = useState('');
  const [paragraphIndent, setParagraphIndent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setLabel(selectedText.substring(0, 50));
      setType('text');
      setOptionsStr('');
      setSourceVariableId('');
      setDependentConfig('');
      setFormulaExpression('');
      setJvField('');
      setParagraphIndent('');
    }
  }, [isOpen, selectedText]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      label: label.trim() || name.trim(),
      type,
      originalText: selectedText,
      value: '',
      optionsStr: optionsStr || undefined,
      sourceVariableId: sourceVariableId || undefined,
      dependentConfig: dependentConfig || undefined,
      formulaExpression: formulaExpression || undefined,
      jvField: jvField || undefined,
      paragraphIndent: paragraphIndent || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0c1424] border border-[#232f4e] rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings2 size={16} className="text-blue-400" /> Cấu hình biến mới
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>

        <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-[10px] text-amber-400 uppercase font-bold mb-1">Text đã chọn</p>
          <p className="text-xs text-amber-200 font-medium break-words">"{selectedText}"</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tên biến (không dấu, duy nhất) *</label>
            <input value={name} onChange={e => setName(e.target.value.replace(/\s/g, '_'))} placeholder="vd: ten_du_an" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" autoFocus />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Nhãn hiển thị</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="vd: Tên dự án" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Loại biến</label>
            <select value={type} onChange={e => setType(e.target.value as TemplateVariable['type'])} className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500">
              <option value="text">Văn bản ngắn</option>
              <option value="long_text">Đoạn văn bản (nhiều dòng)</option>
              <option value="number">Số (định dạng VN)</option>
              <option value="number_to_words">Đọc số thành chữ</option>
              <option value="date">Ngày tháng</option>
              <option value="formula">Công thức tính toán</option>
              <option value="dropdown">Danh sách chọn</option>
              <option value="dependent_dropdown">Danh sách phụ thuộc</option>
              <option value="project">Chọn dự án</option>
              <option value="contractor">Chọn nhà thầu</option>
              <option value="project_dependent">Tự động từ dự án</option>
              <option value="contractor_dependent">Tự động từ nhà thầu</option>
              <option value="joint_venture">Liên danh</option>
              <option value="table">Bảng động</option>
            </select>
          </div>

          {/* Conditional fields based on type */}
          {type === 'dropdown' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Danh sách lựa chọn (phân cách bằng dấu phẩy)</label>
              <input value={optionsStr} onChange={e => setOptionsStr(e.target.value)} placeholder="Lựa chọn A, Lựa chọn B, Lựa chọn C" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
          )}
          {(type === 'number_to_words' || type === 'dependent_dropdown' || type === 'project_dependent' || type === 'contractor_dependent') && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">ID biến nguồn</label>
              <input value={sourceVariableId} onChange={e => setSourceVariableId(e.target.value)} placeholder="ID biến cha" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
          )}
          {(type === 'dependent_dropdown' || type === 'project_dependent' || type === 'contractor_dependent') && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Cấu hình phụ thuộc</label>
              <input value={dependentConfig} onChange={e => setDependentConfig(e.target.value)} placeholder="vd: location hoặc GiaTri1:Con1,Con2" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
          )}
          {type === 'formula' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Biểu thức công thức</label>
              <input value={formulaExpression} onChange={e => setFormulaExpression(e.target.value)} placeholder="{{bien_a}} + {{bien_b}}" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
          )}
          {type === 'joint_venture' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">JV Field mapping</label>
              <select value={jvField} onChange={e => setJvField(e.target.value)} className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500">
                <option value="">-- Chọn field --</option>
                <option value="company_name">Tên công ty</option>
                <option value="representative">Người đại diện</option>
                <option value="position">Chức vụ</option>
                <option value="address">Địa chỉ</option>
                <option value="tax_code">MST</option>
                <option value="bank_account">Số TK</option>
                <option value="bank_name">Ngân hàng</option>
                <option value="phone">Điện thoại</option>
                <option value="email">Email</option>
                <option value="_custom_text">Tuỳ chỉnh (text)</option>
                <option value="_custom_number">Tuỳ chỉnh (số)</option>
                <option value="_custom_date">Tuỳ chỉnh (ngày)</option>
              </select>
            </div>
          )}
          {type === 'long_text' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Thụt đầu dòng (cm)</label>
              <input value={paragraphIndent} onChange={e => setParagraphIndent(e.target.value)} placeholder="0" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
          )}
          {type === 'table' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Cột bảng (phân cách phẩy, col:type)</label>
              <input value={optionsStr} onChange={e => setOptionsStr(e.target.value)} placeholder="stt, noi_dung, gia_tri:number" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg border border-[#232f4e] text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors">Hủy</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Tạo biến</button>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export const DraftingView: React.FC = () => {
  const { setHeaderTitle } = useSettings();
  const { projects, projectDetails, companies, costPackages } = useData();
  const {
    templateFolders, docTemplates, draftDocuments,
    addFolder, deleteFolder: delFolder,
    addTemplate, updateTemplate, deleteTemplate,
    saveDraft, deleteDraft,
  } = useDrafting();

  // Tab state
  const [activeTab, setActiveTab] = useState<'templates' | 'draft'>('draft');

  // Template Manager state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentVariables, setCurrentVariables] = useState<TemplateVariable[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateFolderId, setTemplateFolderId] = useState('');
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Variable Config Dialog state
  const [isVarDialogOpen, setIsVarDialogOpen] = useState(false);
  const [selectedTextForVar, setSelectedTextForVar] = useState('');

  // Draft mode state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects.length > 0 ? projects[0].id : '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [draftVariables, setDraftVariables] = useState<TemplateVariable[]>([]);
  const [searchTemplateQuery, setSearchTemplateQuery] = useState('');
  const [draftFolderId, setDraftFolderId] = useState<string | null>(null);
  const draftPreviewContainerRef = useRef<HTMLDivElement>(null);
  const draftPristineHtmlRef = useRef<string>('');
  const [jvMembers, setJvMembers] = useState<JVMember[]>([]);

  // Loading states
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    setHeaderTitle('SOẠN THẢO VĂN BẢN THEO BIỂU MẪU');
  }, [setHeaderTitle]);

  // ==================== TEMPLATE MANAGER FUNCTIONS ====================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCurrentFile(file);

    if (previewContainerRef.current) {
      setIsRendering(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        await renderAsync(arrayBuffer, previewContainerRef.current, undefined, {
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          useBase64URL: true,
        });
      } catch (err) {
        console.error('Lỗi render docx preview:', err);
      }
      setIsRendering(false);
    }
  };

  const handleMouseUpOnPreview = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (text.length < 1) return;

    setSelectedTextForVar(text);
    setIsVarDialogOpen(true);
  };

  const handleSaveVariable = (varConfig: Partial<TemplateVariable>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setIsVarDialogOpen(false);
      return;
    }

    const newVar: TemplateVariable = {
      id: generateId('var'),
      name: varConfig.name || '',
      label: varConfig.label || '',
      type: varConfig.type || 'text',
      value: '',
      originalText: selectedTextForVar,
      optionsStr: varConfig.optionsStr,
      sourceVariableId: varConfig.sourceVariableId,
      dependentConfig: varConfig.dependentConfig,
      formulaExpression: varConfig.formulaExpression,
      jvField: varConfig.jvField,
      paragraphIndent: varConfig.paragraphIndent,
    };

    // Bọc text đã chọn bằng span highlight
    try {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.setAttribute('data-var-id', newVar.id);
      span.className = 'bg-yellow-200 px-0.5 rounded text-blue-800 border-b border-yellow-400 cursor-pointer';
      span.title = `{{${newVar.name}}} - ${newVar.label}`;
      range.surroundContents(span);
    } catch {
      // Fallback nếu surroundContents fail (cross-node selection)
    }

    setCurrentVariables(prev => [...prev, newVar]);
    setIsVarDialogOpen(false);
    selection.removeAllRanges();
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) return;

    let fileBase64: string | undefined;
    if (currentFile) {
      const buf = await currentFile.arrayBuffer();
      fileBase64 = arrayBufferToBase64(buf);
    }

    const template: DocTemplate = {
      id: editingTemplateId || generateId('tpl'),
      name: newTemplateName.trim(),
      folderId: templateFolderId || '',
      variables: currentVariables,
      previewHtml: previewContainerRef.current?.innerHTML || undefined,
      fileBase64,
      fileName: currentFile?.name,
      createdAt: editingTemplateId ? (docTemplates.find(t => t.id === editingTemplateId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingTemplateId) {
      updateTemplate(template);
    } else {
      addTemplate(template);
    }

    // Reset
    setIsCreatingTemplate(false);
    setNewTemplateName('');
    setCurrentFile(null);
    setCurrentVariables([]);
    setEditingTemplateId(null);
    setTemplateFolderId('');
    if (previewContainerRef.current) previewContainerRef.current.innerHTML = '';
  };

  const handleEditTemplate = async (tpl: DocTemplate) => {
    setEditingTemplateId(tpl.id);
    setNewTemplateName(tpl.name);
    setTemplateFolderId(tpl.folderId);
    setCurrentVariables(tpl.variables || []);
    setIsCreatingTemplate(true);

    // Render preview từ saved HTML hoặc file
    setTimeout(async () => {
      if (previewContainerRef.current) {
        if (tpl.previewHtml) {
          previewContainerRef.current.innerHTML = tpl.previewHtml;
        } else if (tpl.fileBase64) {
          const buf = base64ToArrayBuffer(tpl.fileBase64);
          await renderAsync(buf, previewContainerRef.current, undefined, {
            ignoreWidth: false, ignoreHeight: false, ignoreFonts: false, breakPages: true, useBase64URL: true,
          });
        }
      }
    }, 100);
  };

  // ==================== DRAFT MODE FUNCTIONS ====================
  const handleSelectTemplate = async (templateId: string) => {
    const template = docTemplates.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    setDraftVariables(template.variables.map(v => ({ ...v, value: '' })));
    setJvMembers([]);

    // Render preview
    if (draftPreviewContainerRef.current && template.fileBase64) {
      setIsRendering(true);
      try {
        const buf = base64ToArrayBuffer(template.fileBase64);
        await renderAsync(buf, draftPreviewContainerRef.current, undefined, {
          ignoreWidth: false, ignoreHeight: false, ignoreFonts: false, breakPages: true, useBase64URL: true,
        });
        draftPristineHtmlRef.current = draftPreviewContainerRef.current.innerHTML;
      } catch (err) {
        console.error('Lỗi render draft preview:', err);
      }
      setIsRendering(false);
    } else if (draftPreviewContainerRef.current && template.previewHtml) {
      draftPreviewContainerRef.current.innerHTML = template.previewHtml;
      draftPristineHtmlRef.current = template.previewHtml;
    }
  };

  const handleDraftVariableChange = (varName: string, value: string) => {
    setDraftVariables(prev => prev.map(v => v.name === varName ? { ...v, value } : v));
  };

  const handleDraftNumberInput = (varName: string, value: string) => {
    const numStr = value.replace(/\./g, '').replace(',', '.');
    handleDraftVariableChange(varName, numStr);
  };

  // Auto-compute derived variables (number_to_words, formula, project_dependent, contractor_dependent)
  useEffect(() => {
    let updated = false;
    const newDraft = [...draftVariables];
    const currentProject = projects.find(p => p.id === selectedProjectId);
    const currentDetail = currentProject ? projectDetails[currentProject.id] : undefined;

    newDraft.forEach(v => {
      // number_to_words
      if (v.type === 'number_to_words' && v.sourceVariableId) {
        const parent = newDraft.find(p => p.id === v.sourceVariableId);
        if (parent?.value) {
          const words = numberToWordsVN(parseVnNumber(parent.value));
          if (v.value !== words) { v.value = words; updated = true; }
        }
      }

      // formula
      if (v.type === 'formula' && v.formulaExpression) {
        let expr = v.formulaExpression;
        let allValid = true;
        const rx = /{{(.*?)}}/g;
        let m;
        while ((m = rx.exec(v.formulaExpression)) !== null) {
          const target = newDraft.find(t => t.name === m![1].trim());
          if (target?.value) {
            expr = expr.replace(m[0], (parseVnNumber(target.value) || 0).toString());
          } else {
            allValid = false;
          }
        }
        if (allValid) {
          try {
            const res = new Function('return ' + expr)();
            const resultStr = Number.isInteger(res) ? res.toString() : parseFloat(res).toFixed(2).toString();
            if (!isNaN(res) && isFinite(res) && v.value !== resultStr) { v.value = resultStr; updated = true; }
          } catch { /* ignore */ }
        }
      }

      // project_dependent
      if (v.type === 'project_dependent' && v.dependentConfig && currentProject) {
        const fieldMap: Record<string, string> = {
          name: currentProject.name,
          code: currentProject.code,
          location: currentProject.location,
          totalInvestment: String(currentProject.totalInvestment),
          status: currentProject.status,
          scale: currentDetail?.scale || '',
          approvalDecision: currentDetail?.approvalDecision || '',
          group: currentDetail?.group || '',
          type: currentDetail?.type || '',
          level: currentDetail?.level || '',
        };
        const mappedVal = fieldMap[v.dependentConfig] || '';
        if (v.value !== mappedVal) { v.value = mappedVal; updated = true; }
      }

      // contractor_dependent
      if (v.type === 'contractor_dependent' && v.sourceVariableId && v.dependentConfig) {
        const sourceVar = newDraft.find(s => s.id === v.sourceVariableId);
        if (sourceVar?.value) {
          const matchedCont = companies.find(c => c.name === sourceVar.value);
          if (matchedCont) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const contAny = matchedCont as any;
            const mappedVal = contAny[v.dependentConfig] != null
              ? String(contAny[v.dependentConfig])
              : '';
            if (v.value !== mappedVal) { v.value = mappedVal; updated = true; }
          }
        }
      }
    });

    if (updated) setDraftVariables(newDraft);
  }, [draftVariables, selectedProjectId, projects, projectDetails, companies]);

  // Update live preview when draft variables change
  useEffect(() => {
    if (!draftPreviewContainerRef.current || !selectedTemplateId) return;

    // Restore pristine HTML first
    if (draftPristineHtmlRef.current) {
      draftPreviewContainerRef.current.innerHTML = draftPristineHtmlRef.current;
    }

    // Update each variable span
    draftVariables.forEach(v => {
      const elements = draftPreviewContainerRef.current?.querySelectorAll(`span[data-var-id="${v.id}"]`);
      elements?.forEach(el => {
        let displayValue = v.value;
        if (v.type === 'number' && v.value) displayValue = formatVnNumber(v.value);
        else if (v.type === 'date' && v.value) displayValue = formatVNDateString(v.value);

        if (displayValue) {
          el.textContent = displayValue;
          (el as HTMLElement).className = 'bg-green-100 px-1 rounded text-green-800 border-b border-green-300';
        } else {
          el.textContent = `{{${v.name}}}`;
          (el as HTMLElement).className = 'bg-yellow-200 px-1 rounded text-blue-800 border-b border-yellow-400';
        }
      });
    });
  }, [draftVariables, selectedTemplateId]);

  // ==================== EXPORT WORD ====================
  const handleExport = async () => {
    const template = docTemplates.find(t => t.id === selectedTemplateId);
    if (!template?.fileBase64) {
      alert('Không tìm thấy file gốc .docx của mẫu này!');
      return;
    }

    try {
      const content = base64ToArrayBuffer(template.fileBase64);
      const zip = new PizZip(content);

      let xmlContent = zip.file('word/document.xml')?.asText() || '';

      // Sort variables by originalText length descending
      const sortedVars = [...draftVariables].sort((a, b) => (b.originalText || '').length - (a.originalText || '').length);

      sortedVars.forEach(v => {
        if (v.type === 'joint_venture' || v.type === 'table') return;

        let displayValueRaw = v.value || '';
        if (v.type === 'number') displayValueRaw = formatVnNumber(v.value || '');
        else if (v.type === 'date') displayValueRaw = formatVNDateString(v.value || '');

        if (v.type !== 'long_text') {
          displayValueRaw = displayValueRaw.replace(/[\n\r]+/g, ' ');
        }

        const displayValue = encodeXML(displayValueRaw);
        const targetStr = encodeXML(v.originalText).replace(/[\s\u00A0\n]+/g, ' ').trim();
        if (!targetStr) return;

        // Build plain text mapping from XML
        let plainText = '';
        const plainToXml: number[] = [];
        let inTag = false;

        for (let i = 0; i < xmlContent.length; i++) {
          if (xmlContent[i] === '<') { inTag = true; continue; }
          if (xmlContent[i] === '>') { inTag = false; continue; }
          if (!inTag) { plainToXml.push(i); plainText += xmlContent[i]; }
        }

        const matchIdx = plainText.indexOf(targetStr);
        if (matchIdx < 0) return;

        const matchedIndices: number[] = [];
        for (let k = 0; k < targetStr.length; k++) {
          matchedIndices.push(plainToXml[matchIdx + k]);
        }

        const indicesToDelete = new Set<number>();
        matchedIndices.forEach(idx => {
          if (xmlContent[idx] !== '<') indicesToDelete.add(idx);
        });

        const startXmlIdx = matchedIndices[0];
        const actualEnd = matchedIndices[matchedIndices.length - 1] + 1;

        let newXml = xmlContent.substring(0, startXmlIdx);
        newXml += displayValue;

        for (let i = startXmlIdx; i < actualEnd; i++) {
          if (!indicesToDelete.has(i)) newXml += xmlContent[i];
        }
        newXml += xmlContent.substring(actualEnd);
        xmlContent = newXml;
      });

      zip.file('word/document.xml', xmlContent);

      // Handle table variables with Docxtemplater
      const docData: Record<string, unknown[]> = {};
      let hasTables = false;
      draftVariables.forEach(v => {
        if (v.type === 'table') {
          hasTables = true;
          try {
            const match = v.originalText.match(/#([a-zA-Z0-9_]+)/);
            const key = match ? match[1] : v.name;
            const rows = v.value ? JSON.parse(v.value) : [];
            docData[key] = rows;
          } catch {
            docData[v.name] = [];
          }
        }
      });

      let finalZip = zip;
      if (hasTables) {
        try {
          const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
          doc.render(docData);
          finalZip = doc.getZip() as unknown as PizZip;
        } catch (e) {
          console.error('Docxtemplater error:', e);
        }
      }

      const blob = finalZip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const projectName = projects.find(p => p.id === selectedProjectId)?.code || 'Export';
      saveAs(blob, `${template.name}_${projectName}.docx`);
    } catch (error: unknown) {
      console.error('Export Error:', error);
      alert(`Lỗi xuất file: ${error instanceof Error ? error.message : 'Không xác định'}`);
    }
  };

  // ==================== HELPERS ====================
  const handleAddFolder = () => {
    const name = prompt('Nhập tên thư mục mới:');
    if (name?.trim()) addFolder(name.trim());
  };

  const handleDeleteFolder = (id: string) => {
    if (confirm('Xóa thư mục này? Các mẫu bên trong sẽ chuyển sang "Tất cả".')) delFolder(id);
  };

  const filteredTemplates = docTemplates.filter(t =>
    (!selectedFolderId || t.folderId === selectedFolderId) &&
    (!searchTemplateQuery || t.name.toLowerCase().includes(searchTemplateQuery.toLowerCase()))
  );

  const draftFilteredTemplates = docTemplates.filter(t =>
    (!draftFolderId || t.folderId === draftFolderId) &&
    !t.isDraft &&
    (!searchTemplateQuery || t.name.toLowerCase().includes(searchTemplateQuery.toLowerCase()))
  );

  // ==================== RENDER ====================
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <FileEdit size={20} className="text-blue-400" /> Soạn Thảo Văn Bản
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Upload mẫu .docx → Gán biến → Chọn dự án → Điền form → Xuất Word</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-3 shrink-0 bg-[#0b1222] p-1 rounded-lg border border-[#232f4e] w-fit">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'templates' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          ⚙️ Quản lý Mẫu
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'draft' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          📝 Soạn thảo
        </button>
      </div>

      {/* ==================== TAB: QUẢN LÝ MẪU ==================== */}
      {activeTab === 'templates' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {!isCreatingTemplate ? (
            <div className="flex gap-4 flex-1 min-h-0">
              {/* Sidebar folders */}
              <div className="w-48 shrink-0 overflow-y-auto pr-2 border-r border-[#232f4e]">
                <TemplateFolderSidebar
                  folders={templateFolders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={setSelectedFolderId}
                  onAddFolder={handleAddFolder}
                  onDeleteFolder={handleDeleteFolder}
                />
              </div>

              {/* Template grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-300">
                    {selectedFolderId ? templateFolders.find(f => f.id === selectedFolderId)?.name : 'Tất cả mẫu'}
                    <span className="ml-2 text-slate-500 font-normal">({filteredTemplates.length})</span>
                  </h3>
                  <button
                    onClick={() => { setEditingTemplateId(null); setNewTemplateName(''); setCurrentVariables([]); setCurrentFile(null); setTemplateFolderId(selectedFolderId || ''); setIsCreatingTemplate(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
                  >
                    <Plus size={14} /> Tạo mẫu mới
                  </button>
                </div>

                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-16 text-slate-600 text-xs border-2 border-dashed border-[#232f4e] rounded-xl">
                    Chưa có mẫu văn bản nào. Bấm "Tạo mẫu mới" để bắt đầu.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredTemplates.map(t => (
                      <div key={t.id} className="bg-[#0b1222] border border-[#232f4e] rounded-xl p-3 hover:border-blue-500/50 transition-colors group cursor-pointer" onClick={() => handleEditTemplate(t)}>
                        <div className="flex items-start gap-2">
                          <FileText size={16} className="text-blue-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{t.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{t.variables?.length || 0} biến · {t.fileName || 'Không có file'}</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); if (confirm(`Xóa mẫu "${t.name}"?`)) deleteTemplate(t.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500/60 hover:text-red-400 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Template Editor (Upload + Variable Assignment) */
            <div className="flex gap-4 flex-1 min-h-0">
              {/* Left: Config panel */}
              <div className="w-72 shrink-0 overflow-y-auto space-y-3 pr-2">
                <button onClick={() => { setIsCreatingTemplate(false); setEditingTemplateId(null); }} className="text-xs text-slate-500 hover:text-blue-400 mb-1">← Quay lại danh sách</button>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tên mẫu văn bản *</label>
                  <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="VD: Biên bản nghiệm thu" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Thư mục</label>
                  <select value={templateFolderId} onChange={e => setTemplateFolderId(e.target.value)} className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500">
                    <option value="">Không phân loại</option>
                    {templateFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">File .docx gốc</label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-blue-500/40 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors">
                    <Upload size={14} className="text-blue-400" />
                    <span className="text-xs text-blue-300">{currentFile ? currentFile.name : 'Chọn file .docx'}</span>
                    <input type="file" accept=".docx" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {/* Variables list */}
                {currentVariables.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Biến đã gán ({currentVariables.length})</p>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {currentVariables.map(v => (
                        <div key={v.id} className="flex items-center gap-2 p-2 bg-[#080d1a] border border-[#232f4e] rounded-lg group">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-blue-400 truncate">{`{{${v.name}}}`}</p>
                            <p className="text-[9px] text-slate-500 truncate">{v.label} · {v.type}</p>
                          </div>
                          <button onClick={() => setCurrentVariables(prev => prev.filter(x => x.id !== v.id))} className="opacity-0 group-hover:opacity-100 text-red-500/60 hover:text-red-400">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveTemplate}
                  disabled={!newTemplateName.trim()}
                  className="w-full px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save size={14} /> {editingTemplateId ? 'Cập nhật mẫu' : 'Lưu mẫu'}
                </button>
              </div>

              {/* Right: Preview */}
              <div className="flex-1 min-h-0 border border-[#232f4e] rounded-xl bg-[#1a1f2e] flex flex-col overflow-hidden">
                <div className="bg-[#0c1424] px-4 py-2 border-b border-[#232f4e] flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Soạn mẫu biến</span>
                  <span className="text-[9px] text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded-full">Bôi đen chữ bên dưới để gán biến</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-[#e5e7eb] flex justify-center py-6">
                  {isRendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    </div>
                  )}
                  <div
                    ref={previewContainerRef}
                    onMouseUp={handleMouseUpOnPreview}
                    className="w-full max-w-4xl mx-auto bg-white shadow-2xl"
                    style={{ minHeight: '29.7cm', padding: '2cm' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: SOẠN THẢO ==================== */}
      {activeTab === 'draft' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Step 1: Project selector */}
          <div className="shrink-0 mb-3 p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Bước 1: Chọn dự án</label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="" disabled hidden>Click để chọn dự án</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main 2-pane layout */}
          <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
            {/* Left Panel: Template selector + Variable form */}
            <div className="w-80 lg:w-96 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
              {/* Template selector */}
              <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl shrink-0">
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Bước 2: Chọn mẫu văn bản</label>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    value={searchTemplateQuery}
                    onChange={e => setSearchTemplateQuery(e.target.value)}
                    placeholder="Tìm kiếm mẫu..."
                    className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {selectedTemplateId && (
                  <div className="mb-2 text-[10px] p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg font-semibold flex items-center gap-1.5">
                    <FileText size={12} /> Đang soạn: {docTemplates.find(t => t.id === selectedTemplateId)?.name}
                  </div>
                )}

                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {draftFilteredTemplates.length === 0 ? (
                    <p className="text-center text-slate-600 text-[10px] py-4 italic">Chưa có mẫu. Tạo mẫu ở tab "Quản lý Mẫu".</p>
                  ) : draftFilteredTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${selectedTemplateId === t.id ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
                    >
                      <FileText size={13} className={selectedTemplateId === t.id ? 'text-blue-400' : 'text-slate-600'} />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Variable form */}
              {selectedTemplateId && draftVariables.length > 0 && (
                <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Bước 3: Điền thông tin</p>

                  {(() => {
                    // Deduplicate by name
                    const unique: TemplateVariable[] = [];
                    draftVariables.forEach(v => { if (!unique.find(u => u.name === v.name)) unique.push(v); });
                    return unique.map(v => (
                      <div key={v.id} className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400">{v.label || v.name}</label>

                        {v.type === 'text' && (
                          <input value={v.value} onChange={e => handleDraftVariableChange(v.name, e.target.value)} placeholder="Nhập văn bản..." className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
                        )}
                        {v.type === 'long_text' && (
                          <textarea value={v.value} onChange={e => handleDraftVariableChange(v.name, e.target.value)} placeholder="Nhập đoạn văn bản..." rows={3} className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 resize-y" />
                        )}
                        {v.type === 'number' && (
                          <input value={formatVnNumber(v.value)} onChange={e => handleDraftNumberInput(v.name, e.target.value)} placeholder="0" className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-blue-300 font-mono font-bold focus:outline-none focus:border-blue-500" />
                        )}
                        {v.type === 'date' && (
                          <input type="date" value={v.value} onChange={e => handleDraftVariableChange(v.name, e.target.value)} className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
                        )}
                        {v.type === 'dropdown' && (
                          <select value={v.value} onChange={e => handleDraftVariableChange(v.name, e.target.value)} className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500">
                            <option value="">-- Chọn --</option>
                            {(v.optionsStr || '').split(',').map((o, i) => <option key={i} value={o.trim()}>{o.trim()}</option>)}
                          </select>
                        )}
                        {v.type === 'project' && (
                          <select value={v.value} onChange={e => handleDraftVariableChange(v.name, e.target.value)} className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500">
                            <option value="">-- Chọn dự án --</option>
                            {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        )}
                        {v.type === 'contractor' && (
                          <select value={v.value} onChange={e => handleDraftVariableChange(v.name, e.target.value)} className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500">
                            <option value="">-- Chọn nhà thầu --</option>
                            {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        )}
                        {(v.type === 'number_to_words' || v.type === 'formula' || v.type === 'project_dependent' || v.type === 'contractor_dependent') && (
                          <div className="px-3 py-2 bg-[#080d1a] border border-[#232f4e] rounded-lg text-xs text-slate-400 italic min-h-[36px] flex items-center">
                            {v.type === 'number_to_words' && <span className="text-slate-500 mr-1.5">🤖</span>}
                            {v.type === 'formula' && <span className="text-slate-500 mr-1.5">∑</span>}
                            {(v.type === 'project_dependent' || v.type === 'contractor_dependent') && <span className="text-slate-500 mr-1.5">🧬</span>}
                            <span className="truncate">{v.value || 'Tự động...'}</span>
                          </div>
                        )}
                      </div>
                    ));
                  })()}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-[#232f4e]">
                    <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors">
                      <Download size={14} /> Xuất Word
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Document Preview */}
            <div className="flex-1 min-h-0 border border-[#232f4e] rounded-xl bg-[#1a1f2e] flex flex-col overflow-hidden">
              <div className="bg-[#0c1424] px-4 py-2 border-b border-[#232f4e] shrink-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center block">Xem trước</span>
              </div>
              <div className="flex-1 overflow-y-auto bg-[#53565e] flex justify-center py-6">
                {!selectedTemplateId ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
                    Chọn mẫu văn bản bên trái để xem trước
                  </div>
                ) : (
                  <>
                    {isRendering && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                      </div>
                    )}
                    <div
                      ref={draftPreviewContainerRef}
                      className="w-full max-w-4xl mx-auto bg-white shadow-2xl relative"
                      style={{ minHeight: '29.7cm', padding: '2cm', paddingBottom: '5cm' }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variable Config Dialog */}
      <VariableConfigDialog
        isOpen={isVarDialogOpen}
        selectedText={selectedTextForVar}
        onSave={handleSaveVariable}
        onClose={() => setIsVarDialogOpen(false)}
      />
    </div>
  );
};
