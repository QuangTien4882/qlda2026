import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { TemplateVariable, JVMember } from '../types/drafting';
import { base64ToArrayBuffer, formatVNDateString, encodeXML } from './docxUtils';
import { formatVnNumber } from './numberUtils';
import { JV_STT_WORDS } from '../components/modules/drafting/components/JointVenturePicker';

export interface DocxExportOptions {
  fileBase64: string;
  draftVariables: TemplateVariable[];
  jvMembers?: JVMember[];
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Thay thế text đơn giản trong XML
 */
export function replaceTextInXml(xml: string, searchText: string, replacement: string): string {
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

/**
 * Thay thế một chuỗi text trong cấu trúc XML của Word (.docx)
 * Hỗ trợ text bị ngắt qua nhiều thẻ <w:r>, tự động xử lý thụt đầu dòng và ngắt dòng
 */
export function replaceAllInXml(
  xmlContent: string,
  targetText: string,
  displayValueRaw: string,
  isLongText?: boolean,
  paragraphIndent?: string
): string {
  if (!targetText || !targetText.trim()) return xmlContent;

  let plainText = '';
  const plainToXml: number[] = [];
  let inTag = false;

  for (let i = 0; i < xmlContent.length; i++) {
    if (xmlContent[i] === '<') {
      const tagSlice = xmlContent.substring(i, i + 15);
      if (
        tagSlice.startsWith('<w:tab/>') ||
        tagSlice.startsWith('<w:tab />') ||
        tagSlice.startsWith('<w:tab>')
      ) {
        plainToXml.push(i);
        plainText += ' ';
      } else if (
        tagSlice.startsWith('<w:br/>') ||
        tagSlice.startsWith('<w:br />') ||
        tagSlice.startsWith('<w:br>')
      ) {
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

  // Thay thế từ PHẢI SANG TRÁI (chỉ số lớn xuống nhỏ) để không làm lệch chỉ số XML
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

/**
 * Nhân bản khối thành viên liên danh trong file Word XML
 */
export function cloneJvBlockInXml(
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

/**
 * Tiến trình xuất file Word hoàn chỉnh (chạy được trong Web Worker lẫn Main Thread)
 */
export async function processDocxExport(options: DocxExportOptions): Promise<Blob> {
  const { fileBase64, draftVariables, jvMembers = [], onProgress } = options;

  onProgress?.(15, 'Đang giải nén cấu trúc file Word...');
  const content = base64ToArrayBuffer(fileBase64);
  const zip = new PizZip(content);

  let xmlContent = zip.file('word/document.xml')?.asText() || '';
  if (!xmlContent) {
    throw new Error('Không tìm thấy tệp word/document.xml bên trong file .docx mẫu');
  }

  onProgress?.(40, 'Đang ráp biến và thay thế dữ liệu...');
  const sortedVars = [...draftVariables].sort(
    (a, b) => (b.originalText || '').length - (a.originalText || '').length
  );

  sortedVars.forEach((v) => {
    if (v.type === 'joint_venture' || v.type === 'table') return;

    let displayValueRaw = v.value || '';
    if (v.type === 'number') displayValueRaw = formatVnNumber(v.value || '');
    else if (v.type === 'date') displayValueRaw = formatVNDateString(v.value || '');

    const textsToReplace = Array.from(
      new Set(
        [
          `[${v.name}]`,
          `{{${v.name}}}`,
          v.originalText,
          ...(v.originalTexts || []),
        ].filter(Boolean)
      )
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

  if (jvMembers.length > 0) {
    onProgress?.(65, 'Đang nhân bản khối liên danh nhà thầu...');
    xmlContent = cloneJvBlockInXml(xmlContent, jvMembers, draftVariables);
  }

  zip.file('word/document.xml', xmlContent);

  // Xử lý biến bảng biểu động (Docxtemplater)
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
    onProgress?.(80, 'Đang điền dữ liệu bảng biểu động...');
    try {
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.render(docData);
      finalZip = doc.getZip() as unknown as PizZip;
    } catch (e) {
      console.error('Docxtemplater error:', e);
    }
  }

  onProgress?.(92, 'Đang đóng gói và nén tệp .docx...');
  const blob = finalZip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  onProgress?.(100, 'Hoàn tất!');
  return blob;
}
