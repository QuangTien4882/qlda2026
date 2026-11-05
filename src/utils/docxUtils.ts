/**
 * Tiện ích xử lý Docx, số tiếng Việt, và XML cho Module Soạn Thảo Văn Bản
 */

/**
 * Đọc số nguyên thành chữ tiếng Việt
 * Ví dụ: 1500000 → "Một triệu năm trăm nghìn đồng"
 */
export function numberToWordsVN(numberStr: string | number): string {
  let str = numberStr.toString().replace(/\./g, '').replace(/,/g, '');
  const number = Number(str);
  if (isNaN(number) || number < 0) return '';
  if (number === 0) return 'không đồng';

  const unitWords = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const baseNumbers = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readBlock3(blockStr: string, isFirstBlock: boolean) {
    while (blockStr.length < 3 && !isFirstBlock) blockStr = '0' + blockStr;
    const digits = blockStr.split('').map(d => parseInt(d));
    const res: string[] = [];

    if (digits.length === 3) {
      const [tram, chuc, donvi] = digits;
      if (tram !== 0 || !isFirstBlock) res.push(baseNumbers[tram], 'trăm');

      if (chuc === 0 && donvi !== 0 && (tram !== 0 || !isFirstBlock)) res.push('lẻ');
      else if (chuc === 1) res.push('mười');
      else if (chuc > 1) res.push(baseNumbers[chuc], 'mươi');

      if (donvi === 1 && chuc > 1) res.push('mốt');
      else if (donvi === 4 && chuc > 1) res.push('tư');
      else if (donvi === 5 && chuc > 0) res.push('lăm');
      else if (donvi !== 0) res.push(baseNumbers[donvi]);
    } else if (digits.length === 2) {
      const [chuc, donvi] = digits;
      if (chuc === 1) res.push('mười');
      else if (chuc > 1) res.push(baseNumbers[chuc], 'mươi');

      if (donvi === 1 && chuc > 1) res.push('mốt');
      else if (donvi === 4 && chuc > 1) res.push('tư');
      else if (donvi === 5 && chuc > 0) res.push('lăm');
      else if (donvi !== 0) res.push(baseNumbers[donvi]);
    } else if (digits.length === 1) {
      res.push(baseNumbers[digits[0]]);
    }
    return res.join(' ');
  }

  const chunks: string[] = [];
  let tempSo = str;
  while (tempSo.length > 0) {
    chunks.push(tempSo.slice(-3));
    tempSo = tempSo.slice(0, -3);
  }

  const resultWords: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const block = chunks[i];
    if (parseInt(block) !== 0 || chunks.length === 1) {
      const isFirst = (i === chunks.length - 1);
      const blockStr = readBlock3(block, isFirst);
      if (blockStr) {
        resultWords.push(blockStr + (unitWords[i] ? ' ' + unitWords[i] : ''));
      }
    }
  }

  const finalString = resultWords.join(', ').replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
  const cleaned = finalString.charAt(0).toUpperCase() + finalString.slice(1);
  return cleaned + ' đồng';
}

/**
 * Format ngày từ ISO (YYYY-MM-DD) sang dd/mm/yyyy
 */
export function formatVNDateString(dateString: string): string {
  if (!dateString) return '';
  const datePart = dateString.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) return dateString;
  const d = parseInt(parts[2], 10);
  const m = parseInt(parts[1], 10);
  const y = parts[0];

  const dd = d < 10 ? `0${d}` : `${d}`;
  const mm = m < 10 ? `0${m}` : `${m}`;

  return `${dd}/${mm}/${y}`;
}

/**
 * Encode XML entities
 */
export function encodeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Tìm vị trí text thuần trong XML (bỏ qua tags)
 * Trả về index trong xmlContent nơi text bắt đầu, hoặc -1 nếu không tìm thấy
 */
export function findPlainTextInXml(xml: string, searchText: string): number {
  let plain = '';
  let inTag = false;
  const mapping: number[] = [];
  for (let i = 0; i < xml.length; i++) {
    if (xml[i] === '<') { inTag = true; continue; }
    if (xml[i] === '>') { inTag = false; continue; }
    if (!inTag) { mapping.push(i); plain += xml[i]; }
  }
  const encoded = encodeXML(searchText);
  const plainNormalized = plain.replace(/[\s\u200B-\u200D\uFEFF]/g, '').toLowerCase();
  const searchNormalized = encoded.replace(/[\s\u200B-\u200D\uFEFF]/g, '').toLowerCase();
  const matchIdx = plainNormalized.indexOf(searchNormalized);

  if (matchIdx >= 0) {
    let realPlainIdx = -1;
    let normalizedCount = 0;
    for (let i = 0; i < plain.length; i++) {
      if (!/[\s\u200B-\u200D\uFEFF]/.test(plain[i])) {
        if (normalizedCount === matchIdx) {
          realPlainIdx = i;
          break;
        }
        normalizedCount++;
      }
    }
    if (realPlainIdx >= 0 && mapping[realPlainIdx] !== undefined) return mapping[realPlainIdx];
  }
  return -1;
}

/**
 * Chuyển ArrayBuffer sang Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Chuyển Base64 string sang ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Tạo UUID đơn giản
 */
export function generateId(prefix = 'v'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

