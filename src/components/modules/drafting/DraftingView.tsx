import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileEdit, Upload, Trash2, FileText, Search, Save, Download, Plus, Eye, X, Loader2 } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';
import { useDrafting } from '../../../context/DraftingContext';
import { DocTemplate, TemplateVariable, JVMember, DraftDocument } from '../../../types/drafting';
import { generateId, arrayBufferToBase64, base64ToArrayBuffer, numberToWordsVN, formatVNDateString, encodeXML } from '../../../utils/docxUtils';
import { formatVnNumber, parseVnNumber } from '../../../utils/numberUtils';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { renderAsync } from 'docx-preview';
import { saveAs } from 'file-saver';

// Sub-components
import { TemplateFolderSidebar } from './components/TemplateFolderSidebar';
import { VariableConfigDialog } from './components/VariableConfigDialog';
import { VariableForm } from './components/VariableForm';
import { DraftSaveLoadPanel } from './components/DraftSaveLoadPanel';
import { JointVenturePicker, JV_STT_WORDS } from './components/JointVenturePicker';

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

  // ==================== DRAFT SAVE/LOAD ====================
  const handleSaveDraftDocument = (draft: DraftDocument) => {
    saveDraft(draft);
  };

  const handleLoadDraft = (draft: DraftDocument) => {
    // Restore variables
    setDraftVariables(draft.variables.map(v => ({ ...v })));
    // Restore JV members
    setJvMembers(draft.jvMembers ? draft.jvMembers.map(m => ({ ...m })) : []);
    // Restore project
    if (draft.projectId) setSelectedProjectId(draft.projectId);
    // Make sure template is selected and preview is rendered
    if (draft.templateId !== selectedTemplateId) {
      handleSelectTemplate(draft.templateId).then(() => {
        // After re-render, apply saved variable values
        setDraftVariables(draft.variables.map(v => ({ ...v })));
        if (draft.jvMembers) setJvMembers(draft.jvMembers.map(m => ({ ...m })));
      });
    }
  };

  // ==================== AUTO-COMPUTE DERIVED VARIABLES ====================
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

  // ==================== UPDATE LIVE PREVIEW ====================
  useEffect(() => {
    if (!draftPreviewContainerRef.current || !selectedTemplateId) return;

    // Restore pristine HTML first
    if (draftPristineHtmlRef.current) {
      draftPreviewContainerRef.current.innerHTML = draftPristineHtmlRef.current;
    }

    // Update each variable span
    draftVariables.forEach(v => {
      if (v.type === 'joint_venture') return; // handled by JV block cloning

      const elements = draftPreviewContainerRef.current?.querySelectorAll(`span[data-var-id="${v.id}"]`);
      elements?.forEach(el => {
        let displayValue = v.value;
        if (v.type === 'number' && v.value) displayValue = formatVnNumber(v.value);
        else if (v.type === 'date' && v.value) displayValue = formatVNDateString(v.value);

        if (v.type === 'long_text' && displayValue) {
          // Long text: render each line as a div with optional indent
          (el as HTMLElement).innerHTML = '';
          const lines = displayValue.split('\n');
          lines.forEach(line => {
            const p = document.createElement('div');
            p.textContent = line;
            p.style.margin = '0';
            if (v.paragraphIndent && Number(v.paragraphIndent) > 0) {
              p.style.textIndent = `${v.paragraphIndent}cm`;
            }
            el.appendChild(p);
          });
          (el as HTMLElement).className = 'bg-green-100 px-1 rounded text-green-800 border-b border-green-300';
        } else if (displayValue) {
          el.textContent = displayValue;
          (el as HTMLElement).className = 'bg-green-100 px-1 rounded text-green-800 border-b border-green-300';
        } else {
          el.textContent = `{{${v.name}}}`;
          (el as HTMLElement).className = 'bg-yellow-200 px-1 rounded text-blue-800 border-b border-yellow-400';
        }
      });
    });

    // ==================== JV BLOCK CLONING IN PREVIEW ====================
    if (jvMembers.length > 0) {
      const container = draftPreviewContainerRef.current;
      if (!container) return;

      // Remove old JV clones
      container.querySelectorAll('[data-jv-clone]').forEach(el => el.remove());

      // Find [BAT_DAU_LIEN_DANH] and [KET_THUC_LIEN_DANH] marker elements
      const findMarkerElement = (markerText: string): HTMLElement | null => {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const normalized = (node.textContent || '').replace(/[\s\u200B-\u200D\uFEFF]/g, '');
          if (normalized.includes(markerText.replace(/[\s\u200B-\u200D\uFEFF]/g, ''))) {
            // Walk up to block-level parent (P, DIV, LI, TR)
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
        // Find common parent
        let commonParent = startMarker.parentElement;
        while (commonParent && !commonParent.contains(endMarker)) {
          commonParent = commonParent.parentElement;
        }

        if (commonParent) {
          // Collect template elements between markers
          const templateElements: HTMLElement[] = [];
          let collecting = false;
          const children = Array.from(commonParent.children) as HTMLElement[];

          for (const child of children) {
            if (child === startMarker || child.contains(startMarker)) {
              collecting = true;
              child.style.display = 'none'; // Hide start marker
              child.setAttribute('data-jv-marker', 'start');
              continue;
            }
            if (child === endMarker || child.contains(endMarker)) {
              collecting = false;
              child.style.display = 'none'; // Hide end marker
              child.setAttribute('data-jv-marker', 'end');
              continue;
            }
            if (collecting) {
              templateElements.push(child);
              child.style.display = 'none'; // Hide template
              child.setAttribute('data-jv-template', 'true');
            }
          }

          // Clone for each JV member
          const insertBefore = endMarker;
          jvMembers.forEach((member, memberIdx) => {
            // Separator between members
            if (memberIdx > 0) {
              const sep = document.createElement('div');
              sep.setAttribute('data-jv-clone', 'separator');
              sep.style.cssText = 'border-top: 1px dashed #f97316; margin: 8px 0; opacity: 0.5;';
              commonParent!.insertBefore(sep, insertBefore);
            }

            templateElements.forEach(templateEl => {
              const clone = templateEl.cloneNode(true) as HTMLElement;
              clone.style.display = '';
              clone.setAttribute('data-jv-clone', `member-${memberIdx}`);
              clone.removeAttribute('data-jv-template');

              // Replace JV virtual vars in text
              const replaceInHtml = (html: string) => {
                let result = html;
                result = result.replace(/\[JV_STT\]/g, String(memberIdx + 1));
                result = result.replace(/\[JV_TEN_STT\]/g, JV_STT_WORDS[memberIdx] || `thứ ${memberIdx + 1}`);
                return result;
              };
              clone.innerHTML = replaceInHtml(clone.innerHTML);

              // Replace JV variable spans
              clone.querySelectorAll('span[data-var-id]').forEach(span => {
                const varId = span.getAttribute('data-var-id');
                const matchingVar = draftVariables.find(v => v.id === varId && v.type === 'joint_venture');
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
                    (span as HTMLElement).className = 'bg-purple-100 px-1 rounded text-purple-800 border-b border-purple-300';
                  } else {
                    span.textContent = `{{${matchingVar.name}}}`;
                    (span as HTMLElement).className = 'bg-yellow-200 px-1 rounded text-blue-800 border-b border-yellow-400';
                  }
                }
              });

              commonParent!.insertBefore(clone, insertBefore);
            });
          });
        }
      }
    }
  }, [draftVariables, selectedTemplateId, jvMembers]);

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

        // ---- Long text: paragraph-level XML splitting ----
        if (v.type === 'long_text' && displayValueRaw.includes('\n')) {
          const displayValue = encodeXML(displayValueRaw);
          // Capture paragraph properties (pPr) and run properties (rPr)
          const textBefore = xmlContent.substring(0, startXmlIdx);
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

          // Apply paragraph indent if configured
          let customPPr = pPrMatch;
          if (v.paragraphIndent && Number(v.paragraphIndent) > 0) {
            const twips = Math.round(Number(v.paragraphIndent) * 567); // 1cm = 567 twips
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

          // Split \n into separate Word XML paragraphs
          newXml += displayValue.split('\n').join(`</w:t></w:r></w:p><w:p>${customPPr}<w:r>${rPrMatch}<w:t xml:space="preserve">`);
        } else {
          // Normal (non-long-text) replacement
          const displayValue = encodeXML(displayValueRaw.replace(/[\n\r]+/g, ' '));
          newXml += displayValue;
        }

        for (let i = startXmlIdx; i < actualEnd; i++) {
          if (!indicesToDelete.has(i)) newXml += xmlContent[i];
        }
        newXml += xmlContent.substring(actualEnd);
        xmlContent = newXml;
      });

      // ==================== JV BLOCK CLONING IN WORD XML ====================
      if (jvMembers.length > 0) {
        xmlContent = cloneJvBlockInXml(xmlContent, jvMembers, draftVariables);
      }

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

  const currentTemplateName = docTemplates.find(t => t.id === selectedTemplateId)?.name;
  const currentProjectName = projects.find(p => p.id === selectedProjectId)?.name;

  // Check if template has JV variables
  const hasJvVariables = draftVariables.some(v => v.type === 'joint_venture');

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
            {/* Left Panel: Template selector + Variable form + Draft save/load + JV */}
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
                    <FileText size={12} /> Đang soạn: {currentTemplateName}
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

                  <VariableForm
                    draftVariables={draftVariables}
                    projects={projects}
                    companies={companies}
                    onVariableChange={handleDraftVariableChange}
                    onNumberInput={handleDraftNumberInput}
                  />

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-[#232f4e]">
                    <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors">
                      <Download size={14} /> Xuất Word
                    </button>
                  </div>
                </div>
              )}

              {/* Joint Venture Picker (only if template has JV vars) */}
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

// ==================== JV BLOCK CLONING IN WORD XML ====================
/**
 * Clone khối liên danh trong XML Word.
 * Tìm [BAT_DAU_LIEN_DANH] và [KET_THUC_LIEN_DANH], clone template block cho mỗi JV member.
 */
function cloneJvBlockInXml(
  xmlContent: string,
  jvMembers: JVMember[],
  draftVariables: TemplateVariable[],
): string {
  const startMarkerText = '[BAT_DAU_LIEN_DANH]';
  const endMarkerText = '[KET_THUC_LIEN_DANH]';

  // Helper: find marker in XML by stripping tags
  const findMarkerInXml = (xml: string, marker: string): number => {
    let plain = '';
    let inTag = false;
    const mapping: number[] = [];
    for (let i = 0; i < xml.length; i++) {
      if (xml[i] === '<') { inTag = true; continue; }
      if (xml[i] === '>') { inTag = false; continue; }
      if (!inTag) { mapping.push(i); plain += xml[i]; }
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

  // Expand to enclosing <w:p> tags
  const expandToParagraph = (xml: string, idx: number, direction: 'start' | 'end'): number => {
    if (direction === 'start') {
      // Search backwards for <w:p or <w:p>
      let i = idx;
      while (i > 0) {
        if (xml.substring(i, i + 4) === '<w:p' && (xml[i + 4] === ' ' || xml[i + 4] === '>')) {
          return i;
        }
        i--;
      }
      return idx;
    } else {
      // Search forwards for </w:p>
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

  // Extract paragraphs within block
  const paragraphs = blockXml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];

  // Separate marker paragraphs from template paragraphs
  const stripTags = (xml: string) => xml.replace(/<[^>]+>/g, '').replace(/[\s\u200B-\u200D\uFEFF]/g, '');

  const templateParagraphs: string[] = [];
  for (const p of paragraphs) {
    const plainText = stripTags(p);
    if (plainText.includes(startMarkerText.replace(/[\s]/g, '')) ||
        plainText.includes(endMarkerText.replace(/[\s]/g, ''))) {
      continue; // Skip marker paragraphs
    }
    templateParagraphs.push(p);
  }

  if (templateParagraphs.length === 0) return xmlContent;

  // Clone for each member
  const clonedBlocks: string[] = [];
  jvMembers.forEach((member, memberIdx) => {
    templateParagraphs.forEach(templateP => {
      let clonedP = templateP;

      // Replace virtual variables
      clonedP = replaceTextInXml(clonedP, '[JV_STT]', String(memberIdx + 1));
      clonedP = replaceTextInXml(clonedP, '[JV_TEN_STT]', JV_STT_WORDS[memberIdx] || `thứ ${memberIdx + 1}`);

      // Replace JV field variables
      draftVariables.forEach(v => {
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

  // Reassemble
  const xmlBefore = xmlContent.substring(0, blockStart);
  const xmlAfter = xmlContent.substring(blockEnd);
  return xmlBefore + clonedBlocks.join('') + xmlAfter;
}

/**
 * Replace plain text in Word XML, handling text split across multiple <w:t> runs.
 */
function replaceTextInXml(xml: string, searchText: string, replacement: string): string {
  // Build plain-text-to-XML-index mapping
  let plainText = '';
  const plainToXml: number[] = [];
  let inTag = false;

  for (let i = 0; i < xml.length; i++) {
    if (xml[i] === '<') { inTag = true; continue; }
    if (xml[i] === '>') { inTag = false; continue; }
    if (!inTag) { plainToXml.push(i); plainText += xml[i]; }
  }

  const encoded = encodeXML(searchText).replace(/[\s\u00A0\n]+/g, ' ').trim();
  const matchIdx = plainText.indexOf(encoded);
  if (matchIdx < 0) return xml;

  const matchedIndices: number[] = [];
  for (let k = 0; k < encoded.length; k++) {
    matchedIndices.push(plainToXml[matchIdx + k]);
  }

  const indicesToDelete = new Set<number>();
  matchedIndices.forEach(idx => {
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
