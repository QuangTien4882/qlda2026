import React, { useState, useEffect, useRef } from 'react';
import {
  FileEdit,
  Upload,
  Trash2,
  FileText,
  Search,
  Save,
  Download,
  Plus,
  Loader2,
  Edit3,
  Copy,
  X,
  Check,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';
import { useDrafting } from '../../../context/DraftingContext';
import { DocTemplate, TemplateVariable, JVMember, DraftDocument } from '../../../types/drafting';
import { generateId, arrayBufferToBase64, base64ToArrayBuffer, numberToWordsVN, formatVNDateString, encodeXML } from '../../../utils/docxUtils';
import { formatVnNumber, parseVnNumber } from '../../../utils/numberUtils';
import { CostPackageItem, LegalDocItem } from '../../../types/project';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { renderAsync } from 'docx-preview';
import { saveAs } from 'file-saver';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';

// Sub-components
import { TemplateFolderSidebar } from './components/TemplateFolderSidebar';
import { VariableConfigDialog } from './components/VariableConfigDialog';
import { VariableForm, isProjectSelectorVar } from './components/VariableForm';
import { DraftSaveLoadPanel } from './components/DraftSaveLoadPanel';
import { JointVenturePicker, JV_STT_WORDS } from './components/JointVenturePicker';

/** Helper chuyển đổi tên trường */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Options chung cho docx-preview renderAsync */
const DOCX_PREVIEW_OPTIONS = {
  className: 'docx-preview-content',
  inWrapper: true,
  ignoreWidth: false,
  ignoreHeight: false,
  ignoreFonts: false,
  breakPages: true,
  ignoreLastRenderedPageBreak: true,
  experimental: true,
  trimXmlDeclaration: true,
  useBase64URL: true,
  renderHeaders: true,
  renderFooters: true,
  renderFootnotes: true,
  renderEndnotes: true,
};

/**
 * Sau khi docx-preview renderAsync(), inline styles (font-family, font-size)
 * được promote thành !important nếu cần để đảm bảo giữ nguyên định dạng đặc thù.
 */
function fixDocxPreviewStyles(container: HTMLElement) {
  const allElements = container.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style.fontFamily) {
      htmlEl.style.setProperty('font-family', htmlEl.style.fontFamily, 'important');
    }
    if (htmlEl.style.fontSize) {
      htmlEl.style.setProperty('font-size', htmlEl.style.fontSize, 'important');
    }
    if (htmlEl.style.fontWeight) {
      htmlEl.style.setProperty('font-weight', htmlEl.style.fontWeight, 'important');
    }
    if (htmlEl.style.lineHeight) {
      htmlEl.style.setProperty('line-height', htmlEl.style.lineHeight, 'important');
    }
    if (htmlEl.style.color) {
      htmlEl.style.setProperty('color', htmlEl.style.color, 'important');
    }
  });
}

/**
 * Tìm kiếm chuỗi text bên trong một node cha (kể cả khi text bị ngắt qua nhiều text nodes)
 * và trả về một Range DOM chính xác để bọc thẻ span.
 */
function findRangeForText(root: Node, text: string): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      let p = n.parentElement;
      while (p && p !== root) {
        if (p.hasAttribute('data-var-name') || p.hasAttribute('data-var-id')) {
          return NodeFilter.FILTER_REJECT;
        }
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let charCount = 0;
  const nodes: { node: Text; start: number; end: number }[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const textNode = n as Text;
    const len = textNode.length;
    nodes.push({ node: textNode, start: charCount, end: charCount + len });
    charCount += len;
  }

  const fullText = nodes.map((item) => item.node.nodeValue).join('');
  const idx = fullText.indexOf(text);
  if (idx === -1) return null;
  const endIdx = idx + text.length;

  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  for (const item of nodes) {
    if (!startNode && idx >= item.start && idx < item.end) {
      startNode = item.node;
      startOffset = idx - item.start;
    }
    if (!endNode && endIdx > item.start && endIdx <= item.end) {
      endNode = item.node;
      endOffset = endIdx - item.start;
      break;
    }
  }

  if (startNode && endNode) {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }
  return null;
}

/**
 * Đảm bảo mọi biến trong biểu mẫu đều được bọc bởi thẻ <span data-var-name="..." data-var-id="...">
 * trên DOM xem trước (kể cả khi docx-preview vừa render từ file .docx nguyên bản chưa có thẻ span).
 */
function ensurePreviewVariablesWrapped(container: HTMLElement, variables: TemplateVariable[]) {
  if (!container || !variables || variables.length === 0) return;

  // 1. Gộp các thẻ span liền kề có cùng định dạng bên trong từng paragraph để tránh việc Word ngắt run text
  const paragraphs = Array.from(container.querySelectorAll('p, div, td, li')) as HTMLElement[];
  paragraphs.forEach((p) => {
    let child = p.firstElementChild;
    while (child && child.nextElementSibling) {
      const next = child.nextElementSibling;
      if (
        child.tagName === 'SPAN' &&
        next.tagName === 'SPAN' &&
        !child.hasAttribute('data-var-name') &&
        !next.hasAttribute('data-var-name') &&
        child.className === next.className &&
        (child as HTMLElement).style.cssText === (next as HTMLElement).style.cssText
      ) {
        child.textContent = (child.textContent || '') + (next.textContent || '');
        p.removeChild(next);
      } else {
        child = next;
      }
    }
  });

  // 2. Chuẩn hóa DOM text nodes
  container.normalize();

  // 3. Thu thập các chuỗi mục tiêu cần khớp cho từng biến
  interface TargetMatch {
    target: string;
    v: TemplateVariable;
  }
  const matchTargets: TargetMatch[] = [];

  variables.forEach((v) => {
    const rawTargets = new Set<string>();
    rawTargets.add(`[${v.name}]`);
    rawTargets.add(`{{${v.name}}}`);
    if (v.originalText && v.originalText.trim().length > 0) {
      rawTargets.add(v.originalText.trim());
    }
    if (v.originalTexts && Array.isArray(v.originalTexts)) {
      v.originalTexts.forEach((ot) => {
        if (ot && ot.trim().length > 0) rawTargets.add(ot.trim());
      });
    }

    rawTargets.forEach((t) => {
      if (t.length >= 2) {
        matchTargets.push({ target: t, v });
      }
    });
  });

  // Sắp xếp theo độ dài target giảm dần
  matchTargets.sort((a, b) => b.target.length - a.target.length);

  // 4. Quét qua text nodes và bọc bằng thẻ span
  matchTargets.forEach(({ target, v }) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        let parent = node.parentElement;
        while (parent && parent !== container) {
          if (parent.hasAttribute('data-var-name') || parent.hasAttribute('data-var-id')) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodesToProcess: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.includes(target)) {
        nodesToProcess.push(n as Text);
      }
    }

    nodesToProcess.forEach((textNode) => {
      let current: Text | null = textNode;
      while (current && current.nodeValue && current.nodeValue.includes(target)) {
        const idx = current.nodeValue.indexOf(target);
        if (idx === -1) break;

        const after = current.splitText(idx);
        after.nodeValue = after.nodeValue!.substring(target.length);

        const span = document.createElement('span');
        span.setAttribute('data-var-id', v.id);
        span.setAttribute('data-var-name', v.name);
        span.className =
          'draft-var-span bg-yellow-200/90 text-blue-900 border border-yellow-400 font-semibold px-1 py-0.5 rounded transition-all cursor-pointer';
        span.title = `{{${v.name}}} - ${v.label || v.name}`;
        span.textContent = target;

        after.parentNode?.insertBefore(span, after);
        current = after;
      }
    });
  });

  // 5. Fallback bọc qua findRangeForText cho trường hợp text bị ngắt giữa các node khác nhau
  matchTargets.forEach(({ target, v }) => {
    paragraphs.forEach((p) => {
      const pText = p.textContent || '';
      if (!pText.includes(target)) return;

      const hasVarSpan = Array.from(p.querySelectorAll('span[data-var-name]')).some(
        (s) => s.getAttribute('data-var-name') === v.name
      );
      if (hasVarSpan) return;

      const range = findRangeForText(p, target);
      if (range) {
        try {
          const span = document.createElement('span');
          span.setAttribute('data-var-id', v.id);
          span.setAttribute('data-var-name', v.name);
          span.className =
            'draft-var-span bg-yellow-200/90 text-blue-900 border border-yellow-400 font-semibold px-1 py-0.5 rounded transition-all cursor-pointer';
          span.title = `{{${v.name}}} - ${v.label || v.name}`;
          try {
            range.surroundContents(span);
          } catch {
            const frag = range.extractContents();
            span.appendChild(frag);
            range.insertNode(span);
          }
        } catch (err) {
          console.warn('Fallback range error:', err);
        }
      }
    });
  });
}

/**
 * Trích xuất danh sách tất cả các paragraph lá (leaf blocks) từ container DOM của docx-preview.
 * Tránh lấy trùng các thẻ cha bao bọc để so sánh chính xác văn bản khi người dùng chỉnh sửa.
 */
function getDocParagraphs(container: HTMLElement): HTMLElement[] {
  const standardParagraphs = Array.from(
    container.querySelectorAll('p, .docx_paragraph, h1, h2, h3, h4, h5, h6, li')
  ) as HTMLElement[];

  const emptyCells = Array.from(container.querySelectorAll('td, th')).filter(
    (cell) => cell.querySelectorAll('p, .docx_paragraph').length === 0
  ) as HTMLElement[];

  const all = [...standardParagraphs, ...emptyCells];
  return all.filter((el) => !all.some((other) => other !== el && el.contains(other)));
}

// ==================== MAIN COMPONENT ====================

export const DraftingView: React.FC = () => {
  const { setHeaderTitle } = useSettings();
  const { projects, projectDetails, companies, costPackages, legalDocs } = useData();
  const {
    templateFolders,
    docTemplates,
    draftDocuments,
    addFolder,
    deleteFolder: delFolder,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    saveDraft,
    deleteDraft,
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
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Draft mode state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [draftVariables, setDraftVariables] = useState<TemplateVariable[]>([]);
  const [searchTemplateQuery, setSearchTemplateQuery] = useState('');
  const [draftFolderId, setDraftFolderId] = useState<string | null>(null);
  const draftPreviewContainerRef = useRef<HTMLDivElement>(null);
  const draftPristineHtmlRef = useRef<string>('');
  const [jvMembers, setJvMembers] = useState<JVMember[]>([]);
  const [activeVarName, setActiveVarName] = useState<string | null>(null);
  const [previewRenderVersion, setPreviewRenderVersion] = useState(0);

  // Content Editing states (Cho phép chỉnh sửa trực tiếp nội dung biểu mẫu và lưu lại)
  const [isEditingTemplateContent, setIsEditingTemplateContent] = useState(false);
  const [isSavingEditedTemplate, setIsSavingEditedTemplate] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('');
  const originalParagraphsRef = useRef<{ id: string; originalText: string }[]>([]);

  // Template Manager inline content edit states
  const [isEditingTemplateInModal, setIsEditingTemplateInModal] = useState(false);
  const modalOriginalParagraphsRef = useRef<{ id: string; originalText: string }[]>([]);
  const isJustSavedTemplateRef = useRef(false);

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

    // Tự động điền tên mẫu từ tên file nếu người dùng chưa nhập tên
    const autoName = file.name.replace(/\.[^/.]+$/, '').trim();
    if (!newTemplateName.trim()) {
      setNewTemplateName(autoName);
    }

    if (previewContainerRef.current) {
      setIsRendering(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        await renderAsync(arrayBuffer, previewContainerRef.current, undefined, DOCX_PREVIEW_OPTIONS);
        fixDocxPreviewStyles(previewContainerRef.current);
      } catch (err) {
        console.error('Lỗi render docx preview:', err);
      }
      setIsRendering(false);
    }
  };

  const handleMouseUpOnPreview = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const text = selection.toString().trim();
    if (text.length < 1) return;

    // Lưu lại Range selection trước khi mở modal để không bị mất selection
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    setSelectedTextForVar(text);
    setEditingVariable(null);
    setIsVarDialogOpen(true);
  };

  const handleSaveVariable = (varConfig: Partial<TemplateVariable>) => {
    const targetName = (varConfig.name || '').trim();
    if (!targetName) return;

    // 1. Trường hợp CHỈNH SỬA BIẾN ĐÃ CÓ
    if (editingVariable) {
      setCurrentVariables((prev) =>
        prev.map((v) =>
          v.id === editingVariable.id
            ? {
                ...v,
                name: targetName,
                label: varConfig.label || targetName,
                type: varConfig.type || 'text',
                optionsStr: varConfig.optionsStr,
                sourceVariableId: varConfig.sourceVariableId,
                dependentConfig: varConfig.dependentConfig,
                formulaExpression: varConfig.formulaExpression,
                jvField: varConfig.jvField,
                paragraphIndent: varConfig.paragraphIndent,
              }
            : v
        )
      );

      // Cập nhật thẻ span trên bản xem trước mẫu
      if (previewContainerRef.current) {
        const spans = previewContainerRef.current.querySelectorAll(
          `span[data-var-id="${editingVariable.id}"]`
        );
        spans.forEach((span) => {
          span.setAttribute('data-var-name', targetName);
          span.setAttribute('title', `{{${targetName}}} - ${varConfig.label || targetName}`);
        });
      }

      setEditingVariable(null);
      setIsVarDialogOpen(false);
      savedRangeRef.current = null;
      return;
    }

    // 2. Trường hợp TẠO BIẾN MỚI TỪ TEXT BÔI ĐEN
    const range = savedRangeRef.current;

    // Kiểm tra xem biến này đã tồn tại trong currentVariables hay chưa (theo id hoặc theo name)
    const existingVarIndex = currentVariables.findIndex(
      (v) => v.id === varConfig.id || v.name.toLowerCase() === targetName.toLowerCase()
    );

    let activeVarId = varConfig.id || generateId('var');

    if (existingVarIndex !== -1) {
      // Biến ĐÃ TỒN TẠI: gán thêm vị trí text mới vào danh sách originalTexts của biến đó
      const existingVar = currentVariables[existingVarIndex];
      activeVarId = existingVar.id;
      const combinedTexts = Array.from(
        new Set([...(existingVar.originalTexts || [existingVar.originalText]), selectedTextForVar])
      );
      const updatedVar: TemplateVariable = {
        ...existingVar,
        originalTexts: combinedTexts,
      };
      setCurrentVariables((prev) => prev.map((v, i) => (i === existingVarIndex ? updatedVar : v)));
    } else {
      // Biến MỚI: tạo và thêm vào currentVariables
      const newVar: TemplateVariable = {
        id: activeVarId,
        name: targetName,
        label: varConfig.label || targetName,
        type: varConfig.type || 'text',
        value: '',
        originalText: selectedTextForVar,
        originalTexts: [selectedTextForVar],
        optionsStr: varConfig.optionsStr,
        sourceVariableId: varConfig.sourceVariableId,
        dependentConfig: varConfig.dependentConfig,
        formulaExpression: varConfig.formulaExpression,
        jvField: varConfig.jvField,
        paragraphIndent: varConfig.paragraphIndent,
      };
      setCurrentVariables((prev) => [...prev, newVar]);
    }

    // Bọc đoạn text đã chọn trên DOM preview bằng thẻ span highlight biến
    if (range) {
      try {
        const span = document.createElement('span');
        span.setAttribute('data-var-id', activeVarId);
        span.setAttribute('data-var-name', targetName);
        span.className =
          'bg-yellow-200 px-1 py-0.5 rounded text-blue-900 border border-yellow-400 font-semibold cursor-pointer';
        span.title = `{{${targetName}}} - ${varConfig.label || targetName}`;
        try {
          range.surroundContents(span);
        } catch {
          // Fallback khi range cắt ngang các node text
          const fragment = range.extractContents();
          span.appendChild(fragment);
          range.insertNode(span);
        }
        span.setAttribute('data-original-text', selectedTextForVar);
      } catch (err) {
        console.warn('Lỗi gán span lên text:', err);
      }
    }

    setIsVarDialogOpen(false);
    setEditingVariable(null);
    savedRangeRef.current = null;
    window.getSelection()?.removeAllRanges();
  };

  const handleDeleteVariable = (varId: string) => {
    setCurrentVariables((prev) => prev.filter((x) => x.id !== varId));
    // Mở bọc tất cả thẻ span trên preview tương ứng với biến bị xóa
    if (previewContainerRef.current) {
      const spans = previewContainerRef.current.querySelectorAll(`span[data-var-id="${varId}"]`);
      spans.forEach((span) => {
        if (span.parentNode) {
          const textNode = document.createTextNode(span.textContent || '');
          span.parentNode.replaceChild(textNode, span);
        }
      });
    }
  };

  const handleMoveTemplateVariable = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentVariables.length) return;
    setCurrentVariables((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleStartModalContentEdit = () => {
    const container = previewContainerRef.current;
    if (!container) return;

    const leafBlocks = getDocParagraphs(container);
    const snapshot: { id: string; originalText: string }[] = [];
    leafBlocks.forEach((el, index) => {
      const pid = `modal-p-${index}`;
      el.setAttribute('data-tpl-pid', pid);
      snapshot.push({
        id: pid,
        originalText: (el.innerText || el.textContent || '').trim(),
      });
    });

    modalOriginalParagraphsRef.current = snapshot;
    setIsEditingTemplateInModal(true);
  };

  const handleSaveTemplate = async () => {
    // Tự động lấy tên file hoặc tên mẫu cũ nếu ô tên đang để trống
    const fallbackName =
      currentFile?.name.replace(/\.[^/.]+$/, '').trim() ||
      (editingTemplateId && docTemplates.find((t) => t.id === editingTemplateId)?.name) ||
      'Biểu mẫu mới';
    const finalTemplateName = newTemplateName.trim() || fallbackName;
    if (!finalTemplateName) return;

    let fileBase64: string | undefined;
    let fileName: string | undefined = currentFile?.name;
    if (currentFile) {
      const buf = await currentFile.arrayBuffer();
      fileBase64 = arrayBufferToBase64(buf);
    } else if (editingTemplateId) {
      const prevTpl = docTemplates.find((t) => t.id === editingTemplateId);
      fileBase64 = prevTpl?.fileBase64;
      fileName = prevTpl?.fileName;
    }

    // Đồng bộ nội dung nếu người dùng có sửa trực tiếp trên bản xem trước
    if (fileBase64 && modalOriginalParagraphsRef.current.length > 0 && previewContainerRef.current) {
      try {
        const container = previewContainerRef.current;
        const snapshot = modalOriginalParagraphsRef.current;
        const changes: { orig: string; edited: string }[] = [];

        snapshot.forEach((item) => {
          const el = container.querySelector(`[data-tpl-pid="${item.id}"]`) as HTMLElement | null;
          if (!el) {
            if (item.originalText) changes.push({ orig: item.originalText, edited: '' });
          } else {
            let currentCombinedText = (el.innerText || el.textContent || '').trim();
            let nextSibling = el.nextElementSibling as HTMLElement | null;
            while (
              nextSibling &&
              !nextSibling.hasAttribute('data-tpl-pid') &&
              ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(nextSibling.tagName)
            ) {
              const sibText = (nextSibling.innerText || nextSibling.textContent || '').trim();
              if (sibText) currentCombinedText += '\n' + sibText;
              nextSibling = nextSibling.nextElementSibling as HTMLElement | null;
            }
            if (currentCombinedText !== item.originalText && item.originalText) {
              changes.push({ orig: item.originalText, edited: currentCombinedText });
            }
          }
        });

        if (changes.length > 0) {
          const buf = base64ToArrayBuffer(fileBase64);
          const zip = new PizZip(buf);
          let xmlContent = zip.file('word/document.xml')?.asText() || '';
          changes.forEach((c) => {
            xmlContent = applyContentChange(xmlContent, c.orig, c.edited);
          });
          zip.file('word/document.xml', xmlContent);
          fileBase64 = zip.generate({ type: 'base64' });
        }
      } catch (err) {
        console.warn('Lỗi đồng bộ XML trong modal tạo mẫu:', err);
      }

      previewContainerRef.current.querySelectorAll('[data-tpl-pid]').forEach((el) => {
        el.removeAttribute('data-tpl-pid');
      });
      setIsEditingTemplateInModal(false);
      modalOriginalParagraphsRef.current = [];
    }

    const template: DocTemplate = {
      id: editingTemplateId || generateId('tpl'),
      name: finalTemplateName,
      folderId: templateFolderId || '',
      variables: currentVariables,
      previewHtml: previewContainerRef.current?.innerHTML || undefined,
      fileBase64,
      fileName,
      createdAt: editingTemplateId
        ? docTemplates.find((t) => t.id === editingTemplateId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingTemplateId) {
      updateTemplate(template);
    } else {
      addTemplate(template);
    }

    alert(
      editingTemplateId
        ? `Đã cập nhật mẫu "${finalTemplateName}" thành công!`
        : `Đã lưu mẫu "${finalTemplateName}" thành công với ${currentVariables.length} biến!`
    );

    // Reset & đóng modal
    setIsCreatingTemplate(false);
    setIsEditingTemplateInModal(false);
    modalOriginalParagraphsRef.current = [];
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

    // Render preview từ saved HTML hoặc file sau khi modal Cấp 1 đã mount
    setTimeout(async () => {
      if (previewContainerRef.current) {
        if (tpl.previewHtml) {
          previewContainerRef.current.innerHTML = tpl.previewHtml;
          fixDocxPreviewStyles(previewContainerRef.current);
          ensurePreviewVariablesWrapped(previewContainerRef.current, tpl.variables || []);
        } else if (tpl.fileBase64) {
          const buf = base64ToArrayBuffer(tpl.fileBase64);
          await renderAsync(buf, previewContainerRef.current, undefined, DOCX_PREVIEW_OPTIONS);
          fixDocxPreviewStyles(previewContainerRef.current);
          ensurePreviewVariablesWrapped(previewContainerRef.current, tpl.variables || []);
        }
      }
    }, 150);
  };

  // ==================== DRAFT MODE FUNCTIONS ====================
  const handleSelectTemplate = async (templateId: string) => {
    const template = docTemplates.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    setSelectedProjectId(''); // Yêu cầu: Không tự động chọn dự án nào

    // Yêu cầu: Toàn bộ biến đều không tự động chọn gì cả, khởi tạo rỗng hoàn toàn
    setDraftVariables(template.variables.map((v) => ({ ...v, value: '' })));
    setJvMembers([]);
    setActiveVarName(null);
  };

  // Tự động render văn bản xem trước khi chọn mẫu (đảm bảo ref luôn sẵn sàng, không bị race condition)
  useEffect(() => {
    if (!selectedTemplateId) {
      if (draftPreviewContainerRef.current) draftPreviewContainerRef.current.innerHTML = '';
      draftPristineHtmlRef.current = '';
      return;
    }

    const template = docTemplates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    let isMounted = true;
    const renderPreview = async () => {
      // Nếu vừa mới lưu nội dung template thì giữ nguyên DOM preview hiện tại, không parse đè lại từ đầu
      if (isJustSavedTemplateRef.current) {
        isJustSavedTemplateRef.current = false;
        return;
      }

      // Đợi ngắn 60ms để DOM ref chắc chắn đã sẵn sàng
      await new Promise((r) => setTimeout(r, 60));
      if (!draftPreviewContainerRef.current || !isMounted) return;

      setIsRendering(true);
      try {
        if (template.fileBase64) {
          const buf = base64ToArrayBuffer(template.fileBase64);
          await renderAsync(buf, draftPreviewContainerRef.current, undefined, DOCX_PREVIEW_OPTIONS);
          if (isMounted) {
            fixDocxPreviewStyles(draftPreviewContainerRef.current);
            ensurePreviewVariablesWrapped(draftPreviewContainerRef.current, template.variables);
            draftPristineHtmlRef.current = draftPreviewContainerRef.current.innerHTML;
            setPreviewRenderVersion((v) => v + 1);
          }
        } else if (template.previewHtml) {
          draftPreviewContainerRef.current.innerHTML = template.previewHtml;
          if (isMounted) {
            fixDocxPreviewStyles(draftPreviewContainerRef.current);
            ensurePreviewVariablesWrapped(draftPreviewContainerRef.current, template.variables);
            draftPristineHtmlRef.current = template.previewHtml;
            setPreviewRenderVersion((v) => v + 1);
          }
        }
      } catch (err) {
        console.error('Lỗi render draft preview:', err);
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };

    renderPreview();

    return () => {
      isMounted = false;
    };
  }, [selectedTemplateId, docTemplates]);

  const handleDraftVariableChange = (varName: string, value: string) => {
    setDraftVariables((prev) => {
      let updated = prev.map((v) => (v.name === varName ? { ...v, value } : v));

      const targetVar = prev.find((v) => v.name === varName);
      // Khi chọn hoặc hủy chọn dự án (hỗ trợ cả type === 'project' lẫn project_dependent tên dự án)
      const isProj = targetVar && isProjectSelectorVar(targetVar, prev);
      if (isProj) {
        if (!value) {
          setSelectedProjectId('');
          // Khi hủy chọn dự án: reset toàn bộ biến phụ thuộc dự án & gói thầu về rỗng
          updated = updated.map((v) => {
            if (
              (v.type === 'project_dependent' && !isProjectSelectorVar(v, prev)) ||
              v.type === 'cost_package' ||
              v.type === 'cost_package_dependent' ||
              v.type === 'contractor_dependent' ||
              v.type === 'legal_doc' ||
              v.type === 'legal_doc_dependent' ||
              v.type === 'number_to_words'
            ) {
              return { ...v, value: '' };
            }
            return v;
          });
        } else {
          const matched = projects.find(
            (p) =>
              p.name === value ||
              p.id === value ||
              (p.code && value.includes(p.code))
          );
          if (matched) {
            setSelectedProjectId(matched.id);
          }
        }
      }

      // Khi chọn hoặc hủy chọn gói thầu
      if (targetVar?.type === 'cost_package') {
        if (!value) {
          // Khi hủy chọn gói thầu: reset các biến trích xuất từ gói thầu & nhà thầu & đọc số
          updated = updated.map((v) => {
            if (
              v.type === 'cost_package_dependent' ||
              v.type === 'contractor_dependent' ||
              v.type === 'number_to_words'
            ) {
              return { ...v, value: '' };
            }
            return v;
          });
        }
      }

      return updated;
    });
  };

  const handleReorderDraftVariables = (fromIndex: number, toIndex: number) => {
    setDraftVariables((prev) => {
      const uniqueVars: TemplateVariable[] = [];
      prev.forEach((v) => {
        if (!uniqueVars.find((u) => u.name === v.name)) uniqueVars.push(v);
      });
      if (fromIndex < 0 || fromIndex >= uniqueVars.length || toIndex < 0 || toIndex >= uniqueVars.length) {
        return prev;
      }

      const newUnique = [...uniqueVars];
      const [moved] = newUnique.splice(fromIndex, 1);
      newUnique.splice(toIndex, 0, moved);

      const orderMap = new Map(newUnique.map((v, i) => [v.name, i]));
      const nextDraft = [...prev].sort((a, b) => {
        const orderA = orderMap.has(a.name) ? orderMap.get(a.name)! : 999;
        const orderB = orderMap.has(b.name) ? orderMap.get(b.name)! : 999;
        return orderA - orderB;
      });

      // Cập nhật và lưu lại thứ tự biến vào biểu mẫu đang chọn
      if (selectedTemplateId) {
        const currentTpl = docTemplates.find((t) => t.id === selectedTemplateId);
        if (currentTpl) {
          const updatedVars = [...currentTpl.variables].sort((a, b) => {
            const orderA = orderMap.has(a.name) ? orderMap.get(a.name)! : 999;
            const orderB = orderMap.has(b.name) ? orderMap.get(b.name)! : 999;
            return orderA - orderB;
          });
          updateTemplate({ ...currentTpl, variables: updatedVars });
        }
      }

      return nextDraft;
    });
  };

  const handleDraftNumberInput = (varName: string, value: string) => {
    const numStr = value.replace(/\./g, '').replace(',', '.');
    handleDraftVariableChange(varName, numStr);
  };

  // ==================== TEMPLATE CONTENT EDITING (DIRECT IN-APP EDIT) ====================
  const handleStartEditTemplateContent = () => {
    const container = draftPreviewContainerRef.current;
    const template = docTemplates.find((t) => t.id === selectedTemplateId);
    if (!container || !template) return;

    // 1. Phục hồi về HTML nguyên bản của template để hiển thị các biến [var_name] thay vì giá trị tạm của draft
    if (draftPristineHtmlRef.current) {
      container.innerHTML = draftPristineHtmlRef.current;
      fixDocxPreviewStyles(container);
      ensurePreviewVariablesWrapped(container, template.variables);
    }

    // 2. Snapshot leaf paragraphs
    const leafBlocks = getDocParagraphs(container);
    const snapshot: { id: string; originalText: string }[] = [];
    leafBlocks.forEach((el, index) => {
      const pid = `tpl-p-${index}`;
      el.setAttribute('data-tpl-pid', pid);
      snapshot.push({
        id: pid,
        originalText: (el.innerText || el.textContent || '').trim(),
      });
    });

    originalParagraphsRef.current = snapshot;
    setIsEditingTemplateContent(true);
  };

  const handleCancelEditTemplateContent = () => {
    const container = draftPreviewContainerRef.current;
    const template = docTemplates.find((t) => t.id === selectedTemplateId);
    if (container && template && draftPristineHtmlRef.current) {
      container.innerHTML = draftPristineHtmlRef.current;
      fixDocxPreviewStyles(container);
      ensurePreviewVariablesWrapped(container, template.variables);
    }
    setIsEditingTemplateContent(false);
    setPreviewRenderVersion((v) => v + 1);
  };

  const handleSaveEditedTemplate = async (isNewCopy: boolean, newName?: string) => {
    const container = draftPreviewContainerRef.current;
    const template = docTemplates.find((t) => t.id === selectedTemplateId);
    if (!container || !template) return;

    setIsSavingEditedTemplate(true);
    try {
      // 1. So sánh DOM hiện tại với originalParagraphsRef
      const snapshot = originalParagraphsRef.current;
      const changes: { orig: string; edited: string }[] = [];

      snapshot.forEach((item) => {
        const el = container.querySelector(`[data-tpl-pid="${item.id}"]`) as HTMLElement | null;
        if (!el) {
          if (item.originalText) {
            changes.push({ orig: item.originalText, edited: '' });
          }
        } else {
          let currentCombinedText = (el.innerText || el.textContent || '').trim();

          // Kiểm tra và ghép thêm bất kỳ paragraph/div mới nào được chèn phía sau mà không có data-tpl-pid
          let nextSibling = el.nextElementSibling as HTMLElement | null;
          while (
            nextSibling &&
            !nextSibling.hasAttribute('data-tpl-pid') &&
            ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(nextSibling.tagName)
          ) {
            const sibText = (nextSibling.innerText || nextSibling.textContent || '').trim();
            if (sibText) {
              currentCombinedText += '\n' + sibText;
            }
            nextSibling = nextSibling.nextElementSibling as HTMLElement | null;
          }

          if (currentCombinedText !== item.originalText && item.originalText) {
            changes.push({ orig: item.originalText, edited: currentCombinedText });
          }
        }
      });

      let updatedFileBase64 = template.fileBase64;

      // 2. Cập nhật vào Word XML trong file .docx nếu có thay đổi và có fileBase64
      if (template.fileBase64 && changes.length > 0) {
        const buf = base64ToArrayBuffer(template.fileBase64);
        const zip = new PizZip(buf);
        let xmlContent = zip.file('word/document.xml')?.asText() || '';

        changes.forEach((c) => {
          xmlContent = applyContentChange(xmlContent, c.orig, c.edited);
        });

        zip.file('word/document.xml', xmlContent);
        updatedFileBase64 = zip.generate({ type: 'base64' });
      }

      // 3. Quét phát hiện bất kỳ biến mới nào được thêm qua cú pháp [ten_bien] hoặc {{ten_bien}}
      const fullTextNow = container.innerText || container.textContent || '';
      const varRegex = /\[([a-zA-Z0-9_]+)\]|\{\{([a-zA-Z0-9_]+)\}\}/g;
      let match;
      const foundVarNames = new Set<string>();
      while ((match = varRegex.exec(fullTextNow)) !== null) {
        const varName = match[1] || match[2];
        if (
          varName &&
          !['BAT_DAU_LIEN_DANH', 'KET_THUC_LIEN_DANH', 'JV_STT', 'JV_TEN_STT'].includes(varName)
        ) {
          foundVarNames.add(varName);
        }
      }

      const existingVarNames = new Set((template.variables || []).map((v) => v.name));
      const newVarsToAdd: TemplateVariable[] = [];
      foundVarNames.forEach((vn) => {
        if (!existingVarNames.has(vn)) {
          newVarsToAdd.push({
            id: generateId('var'),
            name: vn,
            label: vn.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            type: 'text',
            value: '',
            originalText: `[${vn}]`,
            originalTexts: [`[${vn}]`],
          });
        }
      });

      const finalVariables = [...(template.variables || []), ...newVarsToAdd];

      // Dọn dẹp attribute data-tpl-pid trước khi lưu
      container.querySelectorAll('[data-tpl-pid]').forEach((el) => {
        el.removeAttribute('data-tpl-pid');
      });

      const finalPreviewHtml = container.innerHTML;

      // Đánh dấu vừa mới lưu để renderPreview không ghi đè lại DOM preview hiện tại
      isJustSavedTemplateRef.current = true;
      draftPristineHtmlRef.current = finalPreviewHtml;
      setIsEditingTemplateContent(false);
      setPreviewRenderVersion((v) => v + 1);

      if (isNewCopy) {
        const finalName = (newName || '').trim() || `${template.name} (Bản sửa đổi)`;
        const newTplId = generateId('tpl');
        const newTemplate: DocTemplate = {
          id: newTplId,
          name: finalName,
          folderId: template.folderId || '',
          variables: finalVariables,
          previewHtml: finalPreviewHtml,
          fileBase64: updatedFileBase64,
          fileName: `${finalName}.docx`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        addTemplate(newTemplate);
        setSelectedTemplateId(newTplId);
        setIsSaveAsModalOpen(false);
        setSaveAsTemplateName('');
        alert(`Đã lưu thành công biểu mẫu mới "${finalName}"!`);
      } else {
        const updatedTemplate: DocTemplate = {
          ...template,
          variables: finalVariables,
          previewHtml: finalPreviewHtml,
          fileBase64: updatedFileBase64,
          updatedAt: new Date().toISOString(),
        };

        updateTemplate(updatedTemplate);
        alert(`Đã lưu cập nhật nội dung vào biểu mẫu "${template.name}" thành công!`);
      }
    } catch (error) {
      console.error('Lỗi lưu nội dung biểu mẫu:', error);
      alert(`Lỗi khi lưu biểu mẫu: ${error instanceof Error ? error.message : 'Không xác định'}`);
    } finally {
      setIsSavingEditedTemplate(false);
    }
  };

  // ==================== DRAFT SAVE/LOAD ====================
  const handleSaveDraftDocument = (draft: DraftDocument) => {
    saveDraft(draft);
  };

  const handleLoadDraft = (draft: DraftDocument) => {
    setDraftVariables(draft.variables.map((v) => ({ ...v })));
    setJvMembers(draft.jvMembers ? draft.jvMembers.map((m) => ({ ...m })) : []);
    if (draft.projectId) setSelectedProjectId(draft.projectId);
    if (draft.templateId !== selectedTemplateId) {
      handleSelectTemplate(draft.templateId).then(() => {
        setDraftVariables(draft.variables.map((v) => ({ ...v })));
        if (draft.jvMembers) setJvMembers(draft.jvMembers.map((m) => ({ ...m })));
      });
    }
  };

  // ==================== AUTO-COMPUTE DERIVED VARIABLES ====================
  useEffect(() => {
    let anyUpdated = false;
    const newDraft = [...draftVariables];

    // Xác định ID dự án hiệu lực dựa trên biến 'project' hoặc 'cost_package'
    let effectiveProjectId = selectedProjectId;

    const projVar = newDraft.find((s) => isProjectSelectorVar(s, newDraft) && s.value);
    if (projVar) {
      const matched = projects.find(
        (p) =>
          p.name.trim().toLowerCase() === projVar.value.trim().toLowerCase() ||
          p.id === projVar.value ||
          (p.code && projVar.value.includes(p.code)) ||
          (p.name && (projVar.value.includes(p.name) || p.name.includes(projVar.value)))
      );
      if (matched && matched.id !== selectedProjectId) {
        effectiveProjectId = matched.id;
        setSelectedProjectId(matched.id);
      }
    }

    const pkgVar = newDraft.find((s) => s.type === 'cost_package' && s.value);
    if (pkgVar?.value) {
      for (const [pid, pkgs] of Object.entries(costPackages)) {
        const found = pkgs.find((cp) => cp.content === pkgVar.value);
        if (found) {
          if (effectiveProjectId !== pid) {
            effectiveProjectId = pid;
            setSelectedProjectId(pid);
          }
          const matchedProj = projects.find((p) => p.id === pid);
          if (matchedProj) {
            const pVar = newDraft.find((s) => isProjectSelectorVar(s, newDraft));
            if (pVar && pVar.value !== matchedProj.name) {
              pVar.value = matchedProj.name;
              anyUpdated = true;
            }
          }
          break;
        }
      }
    }

    const currentProject = projects.find((p) => p.id === effectiveProjectId);
    const currentDetail = currentProject ? projectDetails[currentProject.id] : undefined;
    const currentCostPackages = costPackages[effectiveProjectId] || [];
    const currentLegalDocs = legalDocs[effectiveProjectId] || [];

    // Chạy vòng lặp giải quyết chuỗi phụ thuộc nhiều tầng (tối đa 5 lượt lặp)
    // Ví dụ: cost_package → cost_package_dependent (contractor) → contractor_dependent (address)
    for (let pass = 0; pass < 5; pass++) {
      let passUpdated = false;

      newDraft.forEach((v) => {
        // 1. cost_package_dependent (Trích xuất từ Gói thầu / Nội dung chi phí)
        if (v.type === 'cost_package_dependent' && v.dependentConfig) {
          let targetPkg: CostPackageItem | undefined;
          const sourceVar = v.sourceVariableId
            ? newDraft.find((s) => s.id === v.sourceVariableId || s.name === v.sourceVariableId)
            : newDraft.find((s) => s.type === 'cost_package');
          if (sourceVar?.value) {
            targetPkg = currentCostPackages.find((cp) => cp.content === sourceVar.value);
            if (!targetPkg) {
              for (const pkgs of Object.values(costPackages)) {
                const found = pkgs.find((cp) => cp.content === sourceVar.value);
                if (found) {
                  targetPkg = found;
                  break;
                }
              }
            }
          }

          if (targetPkg) {
            let mappedVal = '';
            const cfg = v.dependentConfig;
            if (cfg === 'content') mappedVal = targetPkg.content;
            else if (cfg === 'contractor') mappedVal = targetPkg.contractor || '';
            else if (cfg === 'estimateValue') mappedVal = targetPkg.estimateValue ? formatVnNumber(targetPkg.estimateValue) : '';
            else if (cfg === 'contractValue') mappedVal = targetPkg.contractValue ? formatVnNumber(targetPkg.contractValue) : '';
            else if (cfg === 'discountRate') mappedVal = targetPkg.discountRate != null ? String(targetPkg.discountRate) : '';
            else if (cfg === 'biddingTime') mappedVal = targetPkg.biddingTime || '';
            else if (cfg === 'biddingForm') mappedVal = targetPkg.biddingForm || '';
            else if (cfg === 'biddingMethod') mappedVal = targetPkg.biddingMethod || '';
            else if (cfg === 'contractNumber') mappedVal = targetPkg.contractNumber || '';
            else if (cfg === 'contractDate') mappedVal = targetPkg.contractDate ? formatVNDateString(targetPkg.contractDate) : '';
            else if (cfg === 'contractType') mappedVal = targetPkg.contractType || '';
            else if (cfg === 'executionTime') mappedVal = targetPkg.executionTime || '';
            else if (cfg === 'status') mappedVal = targetPkg.status || '';
            else if (cfg === 'category') mappedVal = targetPkg.category || '';
            else if (cfg === 'costType') mappedVal = targetPkg.costType || '';

            if (v.value !== mappedVal) {
              v.value = mappedVal;
              passUpdated = true;
              anyUpdated = true;
            }
          } else if (!sourceVar?.value && v.value) {
            v.value = '';
            passUpdated = true;
            anyUpdated = true;
          }
        }

        // 2. contractor_dependent (Trích xuất thông tin từ Nhà thầu)
        if (v.type === 'contractor_dependent' && v.dependentConfig) {
          const sourceVar = v.sourceVariableId
            ? newDraft.find((s) => s.id === v.sourceVariableId || s.name === v.sourceVariableId)
            : newDraft.find(
                (s) =>
                  s.type === 'contractor' ||
                  (s.type === 'cost_package_dependent' && s.dependentConfig === 'contractor') ||
                  s.name.includes('nha_thau') ||
                  s.label.includes('nhà thầu')
              );
          if (sourceVar?.value) {
            const searchName = sourceVar.value.trim().toLowerCase();
            const matchedCont = companies.find((c) => {
              const cName = c.name?.trim().toLowerCase() || '';
              const cShort = c.shortName?.trim().toLowerCase() || '';
              return (
                cName === searchName ||
                (cShort && cShort === searchName) ||
                (searchName && cName.includes(searchName)) ||
                (cName && searchName.includes(cName))
              );
            });

            if (matchedCont) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const contAny = matchedCont as any;
              const cfg = v.dependentConfig;
              const mappedVal =
                contAny[cfg] != null
                  ? String(contAny[cfg])
                  : contAny[toSnakeCase(cfg)] != null
                  ? String(contAny[toSnakeCase(cfg)])
                  : contAny[toCamelCase(cfg)] != null
                  ? String(contAny[toCamelCase(cfg)])
                  : '';
              if (v.value !== mappedVal) {
                v.value = mappedVal;
                passUpdated = true;
                anyUpdated = true;
              }
            }
          } else if (!sourceVar?.value && v.value) {
            v.value = '';
            passUpdated = true;
            anyUpdated = true;
          }
        }

        // 3. legal_doc_dependent (Trích xuất từ Hồ sơ pháp lý)
        if (v.type === 'legal_doc_dependent' && v.dependentConfig) {
          let targetDoc: LegalDocItem | undefined;
          const sourceVar = v.sourceVariableId
            ? newDraft.find((s) => s.id === v.sourceVariableId || s.name === v.sourceVariableId)
            : newDraft.find((s) => s.type === 'legal_doc');
          if (sourceVar?.value) {
            targetDoc = currentLegalDocs.find((ld) => ld.content === sourceVar.value);
          }

          if (targetDoc) {
            let mappedVal = '';
            const cfg = v.dependentConfig;
            if (cfg === 'content') mappedVal = targetDoc.content;
            else if (cfg === 'fileName') mappedVal = targetDoc.fileName || '';
            else if (cfg === 'note') mappedVal = targetDoc.note || '';

            if (v.value !== mappedVal) {
              v.value = mappedVal;
              passUpdated = true;
              anyUpdated = true;
            }
          } else if (!sourceVar?.value && v.value) {
            v.value = '';
            passUpdated = true;
            anyUpdated = true;
          }
        }

        // 4. project_dependent (Thông tin dự án)
        if (v.type === 'project_dependent') {
          if (isProjectSelectorVar(v, newDraft)) {
            // Biến này đóng vai trò là biến chọn dự án: giữ tên dự án hiện tại
            if (currentProject && v.value !== currentProject.name) {
              v.value = currentProject.name;
              passUpdated = true;
              anyUpdated = true;
            } else if (!currentProject && v.value) {
              v.value = '';
              passUpdated = true;
              anyUpdated = true;
            }
          } else if (currentProject) {
            const fieldMap: Record<string, string> = {
              name: currentProject.name,
              code: currentProject.code,
              location: currentProject.location,
              totalInvestment: formatVnNumber(currentProject.totalInvestment),
              status: currentProject.status,
              scale: currentDetail?.scale || '',
              approvalDecision: currentDetail?.approvalDecision || '',
              group: currentDetail?.group || '',
              type: currentDetail?.type || '',
              level: currentDetail?.level || '',
            };

            let cfg = v.dependentConfig || '';
            if (!cfg) {
              const key = (v.name + ' ' + (v.label || '')).toLowerCase();
              if (key.includes('địa điểm') || key.includes('dia_diem') || key.includes('location')) cfg = 'location';
              else if (key.includes('mã dự án') || key.includes('ma_du_an') || key.includes('code')) cfg = 'code';
              else if (key.includes('tổng mức') || key.includes('tong_muc')) cfg = 'totalInvestment';
              else if (key.includes('quy mô') || key.includes('scale')) cfg = 'scale';
              else if (key.includes('phê duyệt') || key.includes('quyet_dinh')) cfg = 'approvalDecision';
              else if (key.includes('tên dự án') || key.includes('ten_du_an')) cfg = 'name';
              else if (key.includes('loại công trình')) cfg = 'type';
              else if (key.includes('cấp công trình')) cfg = 'level';
            }

            const mappedVal = fieldMap[cfg] || '';
            if (mappedVal && v.value !== mappedVal) {
              v.value = mappedVal;
              passUpdated = true;
              anyUpdated = true;
            }
          } else if (v.value) {
            v.value = '';
            passUpdated = true;
            anyUpdated = true;
          }
        }

        // 5. number_to_words (Đọc số thành chữ)
        if (v.type === 'number_to_words') {
          const parent = v.sourceVariableId
            ? newDraft.find((p) => p.id === v.sourceVariableId || p.name === v.sourceVariableId)
            : newDraft.find(
                (p) =>
                  p.type === 'number' ||
                  p.type === 'formula' ||
                  (p.type === 'project_dependent' && p.dependentConfig === 'totalInvestment') ||
                  (p.type === 'cost_package_dependent' &&
                    (p.dependentConfig === 'estimateValue' || p.dependentConfig === 'contractValue'))
              );
          if (parent?.value) {
            const words = numberToWordsVN(parseVnNumber(parent.value));
            if (v.value !== words) {
              v.value = words;
              passUpdated = true;
              anyUpdated = true;
            }
          } else if (v.value) {
            v.value = '';
            passUpdated = true;
            anyUpdated = true;
          }
        }

        // 6. formula (Công thức tính toán)
        if (v.type === 'formula' && v.formulaExpression) {
          let expr = v.formulaExpression;
          let allValid = true;
          const rx = /{{(.*?)}}/g;
          let m;
          while ((m = rx.exec(v.formulaExpression)) !== null) {
            const target = newDraft.find((t) => t.name === m![1].trim() || t.id === m![1].trim());
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
              if (!isNaN(res) && isFinite(res) && v.value !== resultStr) {
                v.value = resultStr;
                passUpdated = true;
                anyUpdated = true;
              }
            } catch {
              /* ignore */
            }
          }
        }
      });

      if (!passUpdated) break;
    }

    if (anyUpdated) setDraftVariables(newDraft);
  }, [draftVariables, selectedProjectId, projects, projectDetails, companies, costPackages, legalDocs]);

  // ==================== UPDATE LIVE PREVIEW ====================
  useEffect(() => {
    if (isEditingTemplateContent) return; // Không can thiệp DOM khi người dùng đang trực tiếp sửa nội dung biểu mẫu
    if (!draftPreviewContainerRef.current || !selectedTemplateId) return;

    // Restore pristine HTML first
    if (draftPristineHtmlRef.current) {
      draftPreviewContainerRef.current.innerHTML = draftPristineHtmlRef.current;
    } else {
      return;
    }

    const container = draftPreviewContainerRef.current;
    const allSpans = Array.from(
      container.querySelectorAll('span[data-var-name], span[data-var-id]')
    ) as HTMLElement[];

    // Update each variable span (tìm tất cả span cùng data-var-id hoặc data-var-name)
    draftVariables.forEach((v) => {
      if (v.type === 'joint_venture') return;

      const matchedElements = allSpans.filter(
        (el) =>
          el.getAttribute('data-var-name') === v.name ||
          el.getAttribute('data-var-id') === v.id
      );

      const isFocused = activeVarName === v.name;

      matchedElements.forEach((el) => {
        // Cho phép click trực tiếp vào biến trên văn bản để focus vào ô nhập bên trái
        el.onclick = () => {
          setActiveVarName(v.name);
        };
        el.style.cursor = 'pointer';

        let displayValue = v.value || '';
        if (v.type === 'number' && v.value) displayValue = formatVnNumber(v.value);
        else if (v.type === 'date' && v.value) displayValue = formatVNDateString(v.value);

        if ((v.type === 'long_text' || v.type === 'legal_doc') && displayValue) {
          el.innerHTML = '';
          const lines = displayValue.split('\n');
          lines.forEach((line) => {
            const p = document.createElement('div');
            p.textContent = line;
            p.style.margin = '0';
            if (v.paragraphIndent && Number(v.paragraphIndent) > 0) {
              p.style.textIndent = `${v.paragraphIndent}cm`;
            }
            el.appendChild(p);
          });
        } else if (displayValue) {
          el.textContent = displayValue;
        } else {
          el.textContent = `[${v.name}]`;
        }

        // Định dạng màu sắc & highlight biến đang nhập
        if (isFocused) {
          el.className =
            'draft-var-span bg-amber-300 text-amber-950 font-bold px-1.5 py-0.5 rounded border border-amber-500 ring-2 ring-blue-500 shadow-lg inline-block animate-pulse scale-[1.02] transition-all';
          el.title = `Biến đang soạn thảo: {{${v.name}}}`;
        } else if (displayValue) {
          el.className =
            'draft-var-span bg-emerald-100 text-emerald-950 font-semibold px-1 py-0.5 rounded border border-emerald-300 transition-colors';
          el.title = `{{${v.name}}}: ${displayValue.slice(0, 50)}`;
        } else {
          el.className =
            'draft-var-span bg-yellow-200/90 text-blue-900 border border-yellow-400 font-semibold px-1 py-0.5 rounded transition-colors';
          el.title = `Chưa nhập dữ liệu: {{${v.name}}}`;
        }
      });
    });

    // Auto-scroll tới biến đang được focus (nếu có)
    if (activeVarName) {
      const activeEl = allSpans.find((el) => el.getAttribute('data-var-name') === activeVarName);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // ==================== JV BLOCK CLONING IN PREVIEW ====================
    if (jvMembers.length > 0) {
      const container = draftPreviewContainerRef.current;
      if (!container) return;

      container.querySelectorAll('[data-jv-clone]').forEach((el) => el.remove());

      const findMarkerElement = (markerText: string): HTMLElement | null => {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const normalized = (node.textContent || '').replace(/[\s\u200B-\u200D\uFEFF]/g, '');
          if (normalized.includes(markerText.replace(/[\s\u200B-\u200D\uFEFF]/g, ''))) {
            let el = node.parentElement;
            while (el && el !== container && !['P', 'DIV', 'LI', 'TR'].includes(el.tagName)) {
              el = el.parentElement;
            }
            return el || (node.parentElement as HTMLElement);
          }
        }
        return null;
      };

      const startMarker = findMarkerElement('[BAT_DAU_LIEN_DANH]');
      const endMarker = findMarkerElement('[KET_THUC_LIEN_DANH]');

      if (startMarker && endMarker) {
        let commonParent = startMarker.parentElement;
        while (commonParent && !commonParent.contains(endMarker)) {
          commonParent = commonParent.parentElement;
        }

        if (commonParent) {
          const templateElements: HTMLElement[] = [];
          let collecting = false;
          const children = Array.from(commonParent.children) as HTMLElement[];

          for (const child of children) {
            if (child === startMarker || child.contains(startMarker)) {
              collecting = true;
              child.style.display = 'none';
              child.setAttribute('data-jv-marker', 'start');
              continue;
            }
            if (child === endMarker || child.contains(endMarker)) {
              collecting = false;
              child.style.display = 'none';
              child.setAttribute('data-jv-marker', 'end');
              continue;
            }
            if (collecting) {
              templateElements.push(child);
              child.style.display = 'none';
              child.setAttribute('data-jv-template', 'true');
            }
          }

          const insertBefore = endMarker;
          jvMembers.forEach((member, memberIdx) => {
            if (memberIdx > 0) {
              const sep = document.createElement('div');
              sep.setAttribute('data-jv-clone', 'separator');
              sep.style.cssText = 'border-top: 1px dashed #f97316; margin: 8px 0; opacity: 0.5;';
              commonParent!.insertBefore(sep, insertBefore);
            }

            templateElements.forEach((templateEl) => {
              const clone = templateEl.cloneNode(true) as HTMLElement;
              clone.style.display = '';
              clone.setAttribute('data-jv-clone', `member-${memberIdx}`);
              clone.removeAttribute('data-jv-template');

              const replaceInHtml = (html: string) => {
                let result = html;
                result = result.replace(/\[JV_STT\]/g, String(memberIdx + 1));
                result = result.replace(/\[JV_TEN_STT\]/g, JV_STT_WORDS[memberIdx] || `thứ ${memberIdx + 1}`);
                return result;
              };
              clone.innerHTML = replaceInHtml(clone.innerHTML);

              clone.querySelectorAll('span[data-var-id]').forEach((span) => {
                const varId = span.getAttribute('data-var-id');
                const matchingVar = draftVariables.find((v) => v.id === varId && v.type === 'joint_venture');
                if (matchingVar && matchingVar.jvField) {
                  let fieldValue = '';
                  const field = matchingVar.jvField;
                  if (field.startsWith('_custom_')) {
                    fieldValue = member._custom_fields?.[matchingVar.id] || '';
                  } else {
                    fieldValue = String(member[field] || '');
                  }
                  if (fieldValue) {
                    span.textContent = fieldValue;
                    (span as HTMLElement).className =
                      'bg-purple-100 px-1 rounded text-purple-900 border-b border-purple-300 font-semibold';
                  } else {
                    span.textContent = `{{${matchingVar.name}}}`;
                    (span as HTMLElement).className =
                      'bg-yellow-200 px-1 rounded text-blue-900 border-b border-yellow-400 font-semibold';
                  }
                }
              });

              commonParent!.insertBefore(clone, insertBefore);
            });
          });
        }
      }
    }
  }, [draftVariables, selectedTemplateId, jvMembers, activeVarName, previewRenderVersion, isEditingTemplateContent]);

  // ==================== EXPORT WORD ====================
  const handleExport = async () => {
    const template = docTemplates.find((t) => t.id === selectedTemplateId);
    if (!template?.fileBase64) {
      alert('Không tìm thấy file gốc .docx của mẫu này!');
      return;
    }

    try {
      const content = base64ToArrayBuffer(template.fileBase64);
      const zip = new PizZip(content);

      let xmlContent = zip.file('word/document.xml')?.asText() || '';

      const sortedVars = [...draftVariables].sort(
        (a, b) => (b.originalText || '').length - (a.originalText || '').length
      );

      // Thay thế tất cả các biến vào Word XML
      sortedVars.forEach((v) => {
        if (v.type === 'joint_venture' || v.type === 'table') return;

        let displayValueRaw = v.value || '';
        if (v.type === 'number') displayValueRaw = formatVnNumber(v.value || '');
        else if (v.type === 'date') displayValueRaw = formatVNDateString(v.value || '');

        // Tập hợp tất cả các chuỗi text gốc cần thay thế cho biến này (gồm originalText, [name], {{name}} và các vị trí đã gán thêm)
        const textsToReplace = Array.from(
          new Set([
            `[${v.name}]`,
            `{{${v.name}}}`,
            v.originalText,
            ...(v.originalTexts || []),
          ].filter(Boolean))
        );

        textsToReplace.forEach((origText) => {
          xmlContent = replaceAllInXml(
            xmlContent,
            origText,
            displayValueRaw,
            v.type === 'long_text' || v.type === 'legal_doc',
            v.paragraphIndent
          );
        });
      });

      // JV block cloning
      if (jvMembers.length > 0) {
        xmlContent = cloneJvBlockInXml(xmlContent, jvMembers, draftVariables);
      }

      zip.file('word/document.xml', xmlContent);

      // Handle table variables with Docxtemplater
      const docData: Record<string, unknown[]> = {};
      let hasTables = false;
      draftVariables.forEach((v) => {
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

      const projectName = projects.find((p) => p.id === selectedProjectId)?.code || 'Export';
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

  const filteredTemplates = docTemplates.filter(
    (t) =>
      (!selectedFolderId || t.folderId === selectedFolderId) &&
      (!searchTemplateQuery || t.name.toLowerCase().includes(searchTemplateQuery.toLowerCase()))
  );

  const draftFilteredTemplates = docTemplates.filter(
    (t) =>
      (!draftFolderId || t.folderId === draftFolderId) &&
      !t.isDraft &&
      (!searchTemplateQuery || t.name.toLowerCase().includes(searchTemplateQuery.toLowerCase()))
  );

  const currentTemplateName = docTemplates.find((t) => t.id === selectedTemplateId)?.name;
  const currentProjectName = projects.find((p) => p.id === selectedProjectId)?.name;

  const hasJvVariables = draftVariables.some((v) => v.type === 'joint_venture');

  // ==================== RENDER ====================
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Bar: Tiêu đề + Chuyển Tab gọn trên 1 hàng để tối ưu chiều cao văn bản */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <FileEdit size={20} className="text-blue-400 shrink-0" />
          <div>
            <h2 className="text-base md:text-lg font-bold text-white leading-tight">
              Soạn Thảo Văn Bản Theo Biểu Mẫu
            </h2>
            <p className="text-[10px] md:text-xs text-slate-500">
              Quản lý mẫu .docx → Ráp biến tự động → Chọn dự án → Điền dữ liệu → Xuất Word
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-[#0b1222] p-1 rounded-lg border border-[#232f4e] shrink-0">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            ⚙️ Quản lý Mẫu
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'draft'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            📝 Soạn thảo
          </button>
        </div>
      </div>

      {/* ==================== TAB: QUẢN LÝ MẪU ==================== */}
      {activeTab === 'templates' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
                  {selectedFolderId ? templateFolders.find((f) => f.id === selectedFolderId)?.name : 'Tất cả mẫu'}
                  <span className="ml-2 text-slate-500 font-normal">({filteredTemplates.length})</span>
                </h3>
                <button
                  onClick={() => {
                    setEditingTemplateId(null);
                    setNewTemplateName('');
                    setCurrentVariables([]);
                    setCurrentFile(null);
                    setTemplateFolderId(selectedFolderId || '');
                    setIsCreatingTemplate(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors shadow-lg shadow-blue-600/20"
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
                  {filteredTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="bg-[#0b1222] border border-[#232f4e] rounded-xl p-3 hover:border-blue-500/50 transition-colors group cursor-pointer"
                      onClick={() => handleEditTemplate(t)}
                    >
                      <div className="flex items-start gap-2">
                        <FileText size={18} className="text-blue-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">{t.name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {t.variables?.length || 0} biến · {t.fileName || 'Không có file'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Xóa mẫu "${t.name}"?`)) deleteTemplate(t.id);
                          }}
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
        </div>
      )}

      {/* ==================== MODAL TẠO / SỬA MẪU VĂN BẢN (CẤP 1) ==================== */}
      <AppModal
        isOpen={isCreatingTemplate}
        onClose={() => {
          setIsCreatingTemplate(false);
          setEditingTemplateId(null);
        }}
        level={1}
        fullScreen={true}
        title={
          <div className="flex items-center gap-2">
            <FileEdit size={22} className="text-blue-400" />
            <span>{editingTemplateId ? 'Chỉnh Sửa Mẫu Văn Bản' : 'Tạo Mẫu Văn Bản Mới'}</span>
          </div>
        }
        subtitle="Tải file .docx mẫu lên, bôi đen đoạn chữ trên bản xem trước để ráp các biến thông tin động"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400">
              Đã gán <strong className="text-blue-300 font-bold">{currentVariables.length}</strong> biến trên biểu mẫu này
            </span>
            <div className="flex items-center gap-2.5">
              <AppButton
                variant="secondary"
                onClick={() => {
                  setIsCreatingTemplate(false);
                  setEditingTemplateId(null);
                }}
              >
                Hủy bỏ
              </AppButton>
              <AppButton
                variant="primary"
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim() && !currentFile && !editingTemplateId}
              >
                <Save size={16} className="mr-1.5" />
                {editingTemplateId ? 'Cập nhật mẫu' : 'Lưu biểu mẫu'}
              </AppButton>
            </div>
          </div>
        }
      >
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-130px)] min-h-0 flex-1">
          {/* Cột trái: Cấu hình biểu mẫu & Danh sách biến (thu hẹp còn 320px để mở rộng bản xem trước) */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-slate-400 uppercase font-bold">
                  Tên mẫu văn bản *
                </label>
                {currentFile && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    (Đã nhận diện file)
                  </span>
                )}
              </div>
              <input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Nhập tên mẫu (VD: Quyết định phê duyệt KQ LCNT)..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
              {!newTemplateName.trim() && currentFile && (
                <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
                  ✓ Khi lưu sẽ dùng tên: <span className="font-semibold underline">{currentFile.name.replace(/\.[^/.]+$/, '')}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Thư mục phân loại</label>
              <select
                value={templateFolderId}
                onChange={(e) => setTemplateFolderId(e.target.value)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">Không phân loại</option>
                {templateFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">File .docx gốc</label>
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-blue-500/40 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors">
                <Upload size={16} className="text-blue-400 shrink-0" />
                <span className="text-xs text-blue-300 truncate">
                  {currentFile
                    ? currentFile.name
                    : (editingTemplateId && docTemplates.find((t) => t.id === editingTemplateId)?.fileName) ||
                      'Chọn file Word (.docx) từ máy...'}
                </span>
                <input type="file" accept=".docx" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Danh sách biến đã gán */}
            <div className="flex-1 flex flex-col min-h-0 border-t border-[#232f4e] pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 uppercase font-bold">
                  Biến đã gán ({currentVariables.length})
                </p>
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-semibold">
                  Bôi đen chữ bên phải
                </span>
              </div>

              {currentVariables.length === 0 ? (
                <div className="p-4 border border-dashed border-[#232f4e] rounded-lg text-center text-xs text-slate-500 italic">
                  Chưa gán biến nào. Hãy bôi đen cụm từ trên trang văn bản để tạo biến.
                </div>
              ) : (
                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                  {currentVariables.map((v, index) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-2 p-2 bg-[#080d1a] border border-[#232f4e] rounded-lg group hover:border-blue-500/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-mono font-bold text-blue-400 truncate">{`{{${v.name}}}`}</p>
                          {v.originalTexts && v.originalTexts.length > 1 && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold shrink-0">
                              {v.originalTexts.length} vị trí
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {v.label} · <span className="text-slate-500 font-mono">[{v.type}]</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveTemplateVariable(index, 'up')}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                          title="Di chuyển lên trên"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={index === currentVariables.length - 1}
                          onClick={() => handleMoveTemplateVariable(index, 'down')}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                          title="Di chuyển xuống dưới"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVariable(v);
                            setSelectedTextForVar(v.originalText || '');
                            setIsVarDialogOpen(true);
                          }}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Chỉnh sửa cấu hình biến"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariable(v.id)}
                          className="p-1 text-red-500/70 hover:text-red-400 transition-colors"
                          title="Xóa biến"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Bản xem trước tài liệu Word */}
          <div className="flex-1 min-h-0 border border-[#232f4e] rounded-xl bg-[#1a1f2e] flex flex-col overflow-hidden">
            <div className="bg-[#0c1424] px-4 py-2.5 border-b border-[#232f4e] flex items-center justify-between shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Bản xem trước biểu mẫu
                </span>
                {isEditingTemplateInModal && (
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 flex items-center gap-1">
                    <Edit3 size={11} /> Đang sửa trực tiếp văn bản
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditingTemplateInModal) {
                      handleStartModalContentEdit();
                    } else {
                      setIsEditingTemplateInModal(false);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isEditingTemplateInModal
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                      : 'bg-[#080d1a] hover:bg-slate-800 text-amber-300 border border-amber-500/40'
                  }`}
                  title={
                    isEditingTemplateInModal
                      ? 'Chuyển lại sang chế độ bôi đen để gán biến'
                      : 'Cho phép chỉnh sửa câu từ trực tiếp trên trang văn bản'
                  }
                >
                  <Edit3 size={12} />
                  <span>{isEditingTemplateInModal ? 'Xong sửa văn bản' : 'Sửa trực tiếp văn bản'}</span>
                </button>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  {isEditingTemplateInModal
                    ? '✏️ Click vào văn bản để chỉnh sửa câu chữ'
                    : '👉 Bôi đen chữ để ráp biến'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#8c92a4] flex justify-center py-6 px-4 relative">
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-xs">
                  <div className="flex items-center gap-2 bg-[#0c1424] px-4 py-2 rounded-lg border border-[#232f4e] text-slate-200 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span>Đang nạp văn bản Word...</span>
                  </div>
                </div>
              )}
              <div
                ref={previewContainerRef}
                contentEditable={isEditingTemplateInModal}
                suppressContentEditableWarning={true}
                onMouseUp={isEditingTemplateInModal ? undefined : handleMouseUpOnPreview}
                className={`w-full max-w-4xl mx-auto docx-preview-container select-text ${
                  isEditingTemplateInModal
                    ? 'ring-2 ring-amber-500/80 rounded cursor-text'
                    : ''
                }`}
              />
            </div>
          </div>
        </div>
      </AppModal>

      {/* ==================== TAB: SOẠN THẢO ==================== */}
      {activeTab === 'draft' && (
        <div className="flex-1 min-h-0 flex gap-3 overflow-hidden h-full">
          {/* Cột trái: Bước 1 (Mẫu văn bản) + Bước 2 (Điền biến) + Xuất file (thu hẹp còn 320px để mở rộng bản xem trước) */}
          <div className="w-72 lg:w-[320px] shrink-0 flex flex-col gap-2.5 overflow-y-auto pr-1 h-full">
            {/* Bước 1: Chọn mẫu văn bản */}
            <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl shrink-0">
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1.5">
                Bước 1: Chọn mẫu văn bản
              </label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  value={searchTemplateQuery}
                  onChange={(e) => setSearchTemplateQuery(e.target.value)}
                  placeholder="Tìm kiếm mẫu..."
                  className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {selectedTemplateId && (
                <div className="mb-2 text-xs p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg font-semibold flex items-center gap-1.5">
                  <FileText size={14} /> Đang soạn: {currentTemplateName}
                </div>
              )}

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {draftFilteredTemplates.length === 0 ? (
                  <p className="text-center text-slate-600 text-xs py-4 italic">
                    Chưa có mẫu nào. Hãy tạo mẫu ở tab "Quản lý Mẫu".
                  </p>
                ) : (
                  draftFilteredTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                        selectedTemplateId === t.id
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <FileText size={14} className={selectedTemplateId === t.id ? 'text-blue-400' : 'text-slate-600'} />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Bước 2: Điền thông tin văn bản */}
            {selectedTemplateId && draftVariables.length > 0 && (
              <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
                <p className="text-xs text-slate-400 uppercase font-bold">Bước 2: Điền thông tin văn bản</p>

                <VariableForm
                  draftVariables={draftVariables}
                  projects={projects}
                  companies={companies}
                  costPackages={selectedProjectId ? (costPackages[selectedProjectId] || []) : []}
                  allCostPackages={costPackages}
                  legalDocs={selectedProjectId ? (legalDocs[selectedProjectId] || []) : []}
                  activeVarName={activeVarName}
                  selectedProjectId={selectedProjectId}
                  onFocusVar={setActiveVarName}
                  onReorderVar={handleReorderDraftVariables}
                  onProjectChange={(pid) => {
                    setSelectedProjectId(pid);
                    const p = projects.find((x) => x.id === pid);
                    if (p) {
                      setDraftVariables((prev) =>
                        prev.map((v) => (isProjectSelectorVar(v, prev) ? { ...v, value: p.name } : v))
                      );
                    } else {
                      setDraftVariables((prev) =>
                        prev.map((v) => {
                          if (
                            v.type === 'project_dependent' ||
                            v.type === 'cost_package' ||
                            v.type === 'cost_package_dependent' ||
                            v.type === 'contractor_dependent' ||
                            v.type === 'legal_doc' ||
                            v.type === 'legal_doc_dependent' ||
                            v.type === 'number_to_words'
                          ) {
                            return { ...v, value: '' };
                          }
                          return v;
                        })
                      );
                    }
                  }}
                  onCostPackageSelect={(cp) => {
                    if (cp.projectId) {
                      setSelectedProjectId(cp.projectId);
                      const p = projects.find((x) => x.id === cp.projectId);
                      if (p) {
                        setDraftVariables((prev) =>
                          prev.map((v) => (isProjectSelectorVar(v, prev) ? { ...v, value: p.name } : v))
                        );
                      }
                    }
                  }}
                  onVariableChange={handleDraftVariableChange}
                  onNumberInput={handleDraftNumberInput}
                />

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-[#232f4e]">
                  <button
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors shadow-lg shadow-blue-600/20"
                  >
                    <Download size={14} /> Xuất File Word (.docx)
                  </button>
                </div>
              </div>
            )}

            {/* Joint Venture Picker */}
            {selectedTemplateId && hasJvVariables && (
              <JointVenturePicker
                jvMembers={jvMembers}
                companies={companies}
                onMembersChange={setJvMembers}
              />
            )}

            {/* Draft Save/Load Panel */}
            {selectedTemplateId && (
              <DraftSaveLoadPanel
                draftDocuments={draftDocuments}
                selectedTemplateId={selectedTemplateId}
                selectedProjectId={selectedProjectId}
                draftVariables={draftVariables}
                jvMembers={jvMembers}
                templateName={currentTemplateName}
                projectName={currentProjectName}
                onSaveDraft={handleSaveDraftDocument}
                onDeleteDraft={deleteDraft}
                onLoadDraft={handleLoadDraft}
              />
            )}
          </div>

          {/* Cột phải: Bản xem trước tài liệu Word - Kéo dài toàn bộ chiều cao màn hình */}
          <div className="flex-1 min-h-0 h-full border border-[#232f4e] rounded-xl bg-[#1a1f2e] flex flex-col overflow-hidden">
            {/* Header thanh công cụ xem trước / chỉnh sửa nội dung mẫu */}
            {!isEditingTemplateContent ? (
              <div className="bg-[#0c1424] px-4 py-2 border-b border-[#232f4e] shrink-0 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider truncate">
                    Bản xem trước trực tiếp {currentTemplateName ? `— ${currentTemplateName}` : ''}
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    (Chuẩn định dạng Word .docx)
                  </span>
                </div>

                {selectedTemplateId && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleStartEditTemplateContent}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
                      title="Chỉnh sửa trực tiếp nội dung văn bản gốc của biểu mẫu này"
                    >
                      <Edit3 size={13} className="text-amber-400" />
                      <span>Chỉnh sửa nội dung biểu mẫu</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-950/70 px-4 py-2 border-b border-amber-500/40 shrink-0 flex items-center justify-between gap-2 flex-wrap animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow">
                    <Edit3 size={13} /> Chế độ sửa nội dung biểu mẫu
                  </span>
                  <span className="text-xs text-amber-200/90 hidden md:inline">
                    Click chuột vào văn bản bên dưới để sửa câu từ, thêm hoặc xóa nội dung
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditTemplateContent}
                    disabled={isSavingEditedTemplate}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSaveAsTemplateName(`${currentTemplateName || 'Biểu mẫu'} (Bản sửa đổi)`);
                      setIsSaveAsModalOpen(true);
                    }}
                    disabled={isSavingEditedTemplate}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Copy size={13} />
                    <span>Lưu thành mẫu mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveEditedTemplate(false)}
                    disabled={isSavingEditedTemplate}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    {isSavingEditedTemplate ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>Lưu vào mẫu này</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto bg-[#7c8394] flex justify-center py-4 px-2 md:px-4 relative">
              {!selectedTemplateId && (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 text-sm font-medium py-12">
                  <FileText size={36} className="text-slate-400/60 mb-2" />
                  <span>Vui lòng chọn một mẫu văn bản ở cột bên trái để bắt đầu soạn thảo</span>
                </div>
              )}
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-xs">
                  <div className="flex items-center gap-2 bg-[#0c1424] px-4 py-2.5 rounded-lg border border-[#232f4e] text-slate-200 text-sm shadow-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span>Đang nạp văn bản Word...</span>
                  </div>
                </div>
              )}
              <div
                ref={draftPreviewContainerRef}
                contentEditable={isEditingTemplateContent}
                suppressContentEditableWarning={true}
                className={`w-full max-w-4xl mx-auto docx-preview-container select-text relative shadow-2xl transition-all ${
                  !selectedTemplateId ? 'hidden' : ''
                } ${
                  isEditingTemplateContent
                    ? 'ring-2 ring-amber-500/80 rounded-md cursor-text shadow-amber-500/10'
                    : ''
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CẤU HÌNH BIẾN (CẤP 2 - 90% CẤP 1) ==================== */}
      <VariableConfigDialog
        isOpen={isVarDialogOpen}
        selectedText={selectedTextForVar}
        editingVariable={editingVariable}
        existingVariables={currentVariables}
        onSave={handleSaveVariable}
        onClose={() => {
          setIsVarDialogOpen(false);
          setEditingVariable(null);
          savedRangeRef.current = null;
        }}
      />

      {/* ==================== MODAL LƯU THÀNH MẪU MỚI ==================== */}
      <AppModal
        isOpen={isSaveAsModalOpen}
        onClose={() => setIsSaveAsModalOpen(false)}
        level={2}
        title={
          <div className="flex items-center gap-2">
            <Copy size={20} className="text-blue-400" />
            <span>Lưu Thành Biểu Mẫu Mới</span>
          </div>
        }
        subtitle="Lưu toàn bộ nội dung văn bản vừa chỉnh sửa thành một biểu mẫu mới độc lập để sử dụng sau này"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <AppButton
              variant="secondary"
              onClick={() => setIsSaveAsModalOpen(false)}
              disabled={isSavingEditedTemplate}
            >
              Hủy bỏ
            </AppButton>
            <AppButton
              variant="primary"
              onClick={() => handleSaveEditedTemplate(true, saveAsTemplateName)}
              disabled={!saveAsTemplateName.trim() || isSavingEditedTemplate}
            >
              {isSavingEditedTemplate ? (
                <Loader2 size={16} className="animate-spin mr-1.5" />
              ) : (
                <Check size={16} className="mr-1.5" />
              )}
              Xác nhận lưu mẫu mới
            </AppButton>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Tên biểu mẫu mới *
            </label>
            <input
              type="text"
              value={saveAsTemplateName}
              onChange={(e) => setSaveAsTemplateName(e.target.value)}
              placeholder="Nhập tên biểu mẫu mới..."
              className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveAsTemplateName.trim() && !isSavingEditedTemplate) {
                  handleSaveEditedTemplate(true, saveAsTemplateName);
                }
              }}
            />
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-200 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-blue-300">
              <AlertCircle size={14} /> Lưu ý:
            </p>
            <p>
              • Biểu mẫu mới sẽ kế thừa toàn bộ cấu hình biến và định dạng từ mẫu hiện tại.
            </p>
            <p>
              • Các chỉnh sửa về câu từ, bổ sung đoạn văn vừa thực hiện sẽ được lưu vĩnh viễn vào biểu mẫu mới này.
            </p>
          </div>
        </div>
      </AppModal>
    </div>
  );
};

// ==================== WORD XML MULTI-OCCURRENCE REPLACEMENT ====================
/**
 * So sánh tìm phân đoạn vi sai (diff) tối thiểu giữa chuỗi gốc và chuỗi đã sửa (theo ranh giới từ).
 */
function computeStringDiff(orig: string, edited: string): { origSnippet: string; editedSnippet: string } {
  const origTrim = orig.trim();
  const editedTrim = edited.trim();
  if (origTrim === editedTrim) return { origSnippet: '', editedSnippet: '' };

  let start = 0;
  while (start < origTrim.length && start < editedTrim.length && origTrim[start] === editedTrim[start]) {
    start++;
  }

  while (start > 0 && !/\s/.test(origTrim[start - 1])) {
    start--;
  }

  let origEnd = origTrim.length - 1;
  let editedEnd = editedTrim.length - 1;
  while (origEnd >= start && editedEnd >= start && origTrim[origEnd] === editedTrim[editedEnd]) {
    origEnd--;
    editedEnd--;
  }

  while (origEnd < origTrim.length - 1 && !/\s/.test(origTrim[origEnd + 1])) {
    origEnd++;
  }
  while (editedEnd < editedTrim.length - 1 && !/\s/.test(editedTrim[editedEnd + 1])) {
    editedEnd++;
  }

  const origSnippet = origTrim.substring(start, origEnd + 1).trim();
  const editedSnippet = editedTrim.substring(start, editedEnd + 1).trim();

  return { origSnippet, editedSnippet };
}

/**
 * Áp dụng thay đổi nội dung vào Word XML:
 * 1. Thử thay thế toàn bộ chuỗi ban đầu.
 * 2. Nếu không khớp do XML chứa biến khác hoặc ngắt tab, tự động tính diff ranh giới từ để thay thế phân đoạn chính xác.
 */
function applyContentChange(xml: string, origText: string, editedText: string): string {
  if (!origText || !origText.trim() || origText === editedText) return xml;

  // 1. Thử thay thế toàn bộ chuỗi
  let updated = replaceAllInXml(xml, origText, editedText, editedText.includes('\n'));
  if (updated !== xml) {
    return updated;
  }

  // 2. Thử thay thế phần vi sai (diff) giữa chuỗi gốc và chuỗi sửa
  const { origSnippet, editedSnippet } = computeStringDiff(origText, editedText);
  if (origSnippet && origSnippet !== origText) {
    updated = replaceAllInXml(xml, origSnippet, editedSnippet, editedSnippet.includes('\n'));
    if (updated !== xml) {
      return updated;
    }
  }

  return xml;
}

/**
 * Thay thế TẤT CẢ các vị trí xuất hiện của chuỗi text trong file Word XML.
 * - Nhận diện cả <w:tab/> và <w:br/> thành ký tự khoảng trắng/xuống dòng để khớp chính xác.
 * - Cho phép khớp linh hoạt với bất kỳ chuỗi khoảng trắng nào (\s+).
 * - Thay thế từ phải sang trái (vị trí lớn xuống nhỏ) để không làm lệch chỉ số ký tự.
 */
function replaceAllInXml(
  xmlContent: string,
  targetText: string,
  displayValueRaw: string,
  isLongText?: boolean,
  paragraphIndent?: string
): string {
  if (!targetText || !targetText.trim()) return xmlContent;

  // Xây dựng ánh xạ plain text -> XML index (hỗ trợ nhận diện <w:tab/> và <w:br/>)
  let plainText = '';
  const plainToXml: number[] = [];
  let inTag = false;

  for (let i = 0; i < xmlContent.length; i++) {
    if (xmlContent[i] === '<') {
      const tagSlice = xmlContent.substring(i, i + 15);
      if (tagSlice.startsWith('<w:tab/>') || tagSlice.startsWith('<w:tab />') || tagSlice.startsWith('<w:tab>')) {
        plainToXml.push(i);
        plainText += ' ';
      } else if (tagSlice.startsWith('<w:br/>') || tagSlice.startsWith('<w:br />') || tagSlice.startsWith('<w:br>')) {
        plainToXml.push(i);
        plainText += '\n';
      }
      inTag = true;
      continue;
    }
    if (xmlContent[i] === '>') {
      inTag = false;
      continue;
    }
    if (!inTag) {
      plainToXml.push(i);
      plainText += xmlContent[i];
    }
  }

  // Tách targetText thành các từ và tạo regex linh hoạt với khoảng trắng
  const targetWords = targetText.trim().split(/\s+/).filter(Boolean);
  if (targetWords.length === 0) return xmlContent;

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = targetWords.map(escapeRegex).join('\\s+');
  const rx = new RegExp(pattern, 'g');

  const matches: { start: number; length: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = rx.exec(plainText)) !== null) {
    matches.push({
      start: m.index,
      length: m[0].length,
    });
  }

  if (matches.length === 0) return xmlContent;

  let currentXml = xmlContent;

  // Thay thế từ PHẢI SANG TRÁI (vị trí lớn xuống nhỏ) để không làm lệch chỉ số XML
  for (let idx = matches.length - 1; idx >= 0; idx--) {
    const match = matches[idx];
    const matchedIndices: number[] = [];
    for (let k = 0; k < match.length; k++) {
      if (plainToXml[match.start + k] !== undefined) {
        matchedIndices.push(plainToXml[match.start + k]);
      }
    }
    if (matchedIndices.length === 0) continue;

    const indicesToDelete = new Set<number>();
    matchedIndices.forEach((xmlIdx) => {
      if (currentXml[xmlIdx] !== '<') indicesToDelete.add(xmlIdx);
    });

    const startXmlIdx = matchedIndices[0];
    const actualEnd = matchedIndices[matchedIndices.length - 1] + 1;

    let newXml = currentXml.substring(0, startXmlIdx);

    if (isLongText && displayValueRaw.includes('\n')) {
      const displayValue = encodeXML(displayValueRaw);
      const textBefore = currentXml.substring(0, startXmlIdx);
      const lastPStart = Math.max(textBefore.lastIndexOf('<w:p '), textBefore.lastIndexOf('<w:p>'));
      let pPrMatch = '';
      let rPrMatch = '';
      if (lastPStart !== -1) {
        const pContent = textBefore.substring(lastPStart);
        const pPrRes = pContent.match(/<w:pPr>.*?<\/w:pPr>/);
        if (pPrRes) pPrMatch = pPrRes[0];
        const lastRStart = Math.max(textBefore.lastIndexOf('<w:r '), textBefore.lastIndexOf('<w:r>'));
        if (lastRStart !== -1 && lastRStart > lastPStart) {
          const rContent = textBefore.substring(lastRStart);
          const rPrRes = rContent.match(/<w:rPr>.*?<\/w:rPr>/);
          if (rPrRes) rPrMatch = rPrRes[0];
        }
      }

      let customPPr = pPrMatch;
      if (paragraphIndent && Number(paragraphIndent) > 0) {
        const twips = Math.round(Number(paragraphIndent) * 567);
        if (customPPr) {
          if (customPPr.includes('<w:ind ')) {
            customPPr = customPPr.replace(/<w:ind [^>]*\/>/, `<w:ind w:firstLine="${twips}"/>`);
          } else {
            customPPr = customPPr.replace('</w:pPr>', `<w:ind w:firstLine="${twips}"/></w:pPr>`);
          }
        } else {
          customPPr = `<w:pPr><w:ind w:firstLine="${twips}"/></w:pPr>`;
        }
      }

      newXml += displayValue
        .split('\n')
        .join(`</w:t></w:r></w:p><w:p>${customPPr}<w:r>${rPrMatch}<w:t xml:space="preserve">`);
    } else {
      const displayValue = encodeXML(displayValueRaw.replace(/[\n\r]+/g, ' '));
      newXml += displayValue;
    }

    for (let i = startXmlIdx; i < actualEnd; i++) {
      if (!indicesToDelete.has(i)) newXml += currentXml[i];
    }
    newXml += currentXml.substring(actualEnd);
    currentXml = newXml;
  }

  return currentXml;
}

// ==================== JV BLOCK CLONING IN WORD XML ====================
function cloneJvBlockInXml(
  xmlContent: string,
  jvMembers: JVMember[],
  draftVariables: TemplateVariable[]
): string {
  const startMarkerText = '[BAT_DAU_LIEN_DANH]';
  const endMarkerText = '[KET_THUC_LIEN_DANH]';

  const findMarkerInXml = (xml: string, marker: string): number => {
    let plain = '';
    let inTag = false;
    const mapping: number[] = [];
    for (let i = 0; i < xml.length; i++) {
      if (xml[i] === '<') {
        inTag = true;
        continue;
      }
      if (xml[i] === '>') {
        inTag = false;
        continue;
      }
      if (!inTag) {
        mapping.push(i);
        plain += xml[i];
      }
    }
    const normalized = plain.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
    const markerNorm = marker.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
    const idx = normalized.indexOf(markerNorm);
    if (idx >= 0 && mapping[idx] !== undefined) return mapping[idx];
    return -1;
  };

  const startIdx = findMarkerInXml(xmlContent, startMarkerText);
  const endIdx = findMarkerInXml(xmlContent, endMarkerText);

  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) return xmlContent;

  const expandToParagraph = (xml: string, idx: number, direction: 'start' | 'end'): number => {
    if (direction === 'start') {
      let i = idx;
      while (i > 0) {
        if (xml.substring(i, i + 4) === '<w:p' && (xml[i + 4] === ' ' || xml[i + 4] === '>')) {
          return i;
        }
        i--;
      }
      return idx;
    } else {
      let i = idx;
      while (i < xml.length - 5) {
        if (xml.substring(i, i + 6) === '</w:p>') {
          return i + 6;
        }
        i++;
      }
      return idx;
    }
  };

  const blockStart = expandToParagraph(xmlContent, startIdx, 'start');
  const blockEnd = expandToParagraph(xmlContent, endIdx, 'end');

  const blockXml = xmlContent.substring(blockStart, blockEnd);
  const paragraphs = blockXml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];

  const stripTags = (xml: string) => xml.replace(/<[^>]+>/g, '').replace(/[\s\u200B-\u200D\uFEFF]/g, '');

  const templateParagraphs: string[] = [];
  for (const p of paragraphs) {
    const plainText = stripTags(p);
    if (
      plainText.includes(startMarkerText.replace(/[\s]/g, '')) ||
      plainText.includes(endMarkerText.replace(/[\s]/g, ''))
    ) {
      continue;
    }
    templateParagraphs.push(p);
  }

  if (templateParagraphs.length === 0) return xmlContent;

  const clonedBlocks: string[] = [];
  jvMembers.forEach((member, memberIdx) => {
    templateParagraphs.forEach((templateP) => {
      let clonedP = templateP;

      clonedP = replaceTextInXml(clonedP, '[JV_STT]', String(memberIdx + 1));
      clonedP = replaceTextInXml(clonedP, '[JV_TEN_STT]', JV_STT_WORDS[memberIdx] || `thứ ${memberIdx + 1}`);

      draftVariables.forEach((v) => {
        if (v.type !== 'joint_venture' || !v.jvField || !v.originalText) return;
        let fieldValue = '';
        const field = v.jvField;
        if (field.startsWith('_custom_')) {
          fieldValue = member._custom_fields?.[v.id] || '';
        } else {
          fieldValue = String(member[field] || '');
        }
        if (fieldValue) {
          clonedP = replaceTextInXml(clonedP, v.originalText, fieldValue);
        }
      });

      clonedBlocks.push(clonedP);
    });
  });

  const xmlBefore = xmlContent.substring(0, blockStart);
  const xmlAfter = xmlContent.substring(blockEnd);
  return xmlBefore + clonedBlocks.join('') + xmlAfter;
}

function replaceTextInXml(xml: string, searchText: string, replacement: string): string {
  let plainText = '';
  const plainToXml: number[] = [];
  let inTag = false;

  for (let i = 0; i < xml.length; i++) {
    if (xml[i] === '<') {
      inTag = true;
      continue;
    }
    if (xml[i] === '>') {
      inTag = false;
      continue;
    }
    if (!inTag) {
      plainToXml.push(i);
      plainText += xml[i];
    }
  }

  const encoded = encodeXML(searchText).replace(/[\s\u00A0\n]+/g, ' ').trim();
  const matchIdx = plainText.indexOf(encoded);
  if (matchIdx < 0) return xml;

  const matchedIndices: number[] = [];
  for (let k = 0; k < encoded.length; k++) {
    matchedIndices.push(plainToXml[matchIdx + k]);
  }

  const indicesToDelete = new Set<number>();
  matchedIndices.forEach((idx) => {
    if (xml[idx] !== '<') indicesToDelete.add(idx);
  });

  const startXmlIdx = matchedIndices[0];
  const actualEnd = matchedIndices[matchedIndices.length - 1] + 1;

  let result = xml.substring(0, startXmlIdx);
  result += encodeXML(replacement);

  for (let i = startXmlIdx; i < actualEnd; i++) {
    if (!indicesToDelete.has(i)) result += xml[i];
  }
  result += xml.substring(actualEnd);
  return result;
}
