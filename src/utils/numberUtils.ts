/**
 * Tiện ích xử lý Số theo Chuẩn Việt Nam:
 * - Hàng nghìn phân cách bằng dấu chấm "."
 * - Số thập phân phân cách bằng dấu phẩy ","
 * - Hỗ trợ định dạng Realtime khi người dùng gõ phím
 */

/**
 * Định dạng số hoặc chuỗi số sang định dạng chuẩn Việt Nam: 1.250.000,50
 * @param val Giá trị số hoặc chuỗi
 * @param allowDecimals Cho phép số thập phân
 */
export function formatVnNumber(
  val: number | string | null | undefined,
  allowDecimals = true
): string {
  if (val === null || val === undefined || val === '') return '';

  let raw = String(val).trim();

  // Nếu là số âm
  const isNegative = raw.startsWith('-');
  if (isNegative) {
    raw = raw.substring(1);
  }

  // Tách phần nguyên và phần thập phân (theo dấu phẩy)
  // Nếu truyền vào số JS có dấu chấm thì thay thế dấu chấm thập phân thành phẩy nếu chưa có phẩy
  if (typeof val === 'number') {
    const parts = val.toString().split('.');
    const integerStr = parts[0];
    const decimalStr = parts[1];
    const formattedInteger = integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const result = decimalStr !== undefined ? `${formattedInteger},${decimalStr}` : formattedInteger;
    return isNegative ? `-${result}` : result;
  }

  // Nếu là chuỗi nhập từ bàn phím (người dùng có thể gõ dấu chấm hoặc dấu phẩy)
  // Quy ước: dấu phẩy là thập phân, các dấu chấm trước đó là phân cách hàng nghìn
  const parts = raw.split(',');
  const integerDigits = parts[0].replace(/\D/g, '');

  if (integerDigits === '' && parts.length > 1) {
    // Trường hợp người dùng gõ ",5"
    const decimalPart = parts[1].replace(/\D/g, '');
    const res = `0,${decimalPart}`;
    return isNegative ? `-${res}` : res;
  }

  if (integerDigits === '') return '';

  // Định dạng phần nguyên với dấu chấm
  const formattedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (allowDecimals && parts.length > 1) {
    // Có dấu phẩy thập phân
    const decimalDigits = parts[1].replace(/\D/g, '');
    // Giữ dấu phẩy kể cả khi chưa gõ phần thập phân (đang gõ "1.000,")
    const res = parts[1] === '' ? `${formattedInteger},` : `${formattedInteger},${decimalDigits}`;
    return isNegative ? `-${res}` : res;
  }

  return isNegative ? `-${formattedInteger}` : formattedInteger;
}

/**
 * Chuyển chuỗi định dạng Việt Nam sang giá trị float/number chuẩn của JS
 * Ví dụ: "1.250.000,75" -> 1250000.75
 */
export function parseVnNumber(formattedStr: string | null | undefined): number {
  if (!formattedStr) return 0;
  const str = String(formattedStr).trim();
  if (!str) return 0;

  // Loại bỏ các dấu chấm phân cách hàng nghìn
  // Thay thế dấu phẩy thập phân thành dấu chấm của JS
  const normalized = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Định dạng tiền tệ VNĐ: "15.000.000.000 VNĐ"
 */
export function formatVnCurrency(val: number | string | null | undefined, suffix = ' VNĐ'): string {
  const formatted = formatVnNumber(val, false);
  return formatted ? `${formatted}${suffix}` : `0${suffix}`;
}

/**
 * Rút gọn số tiền lớn cho các bảng thống kê và KPI: "15,5 tỷ" hoặc "850 triệu"
 */
export function formatCompactVnCurrency(val: number): string {
  if (!val || isNaN(val)) return '0 đ';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs >= 1_000_000_000_000) {
    const n = (abs / 1_000_000_000_000).toFixed(2).replace('.', ',');
    return `${sign}${n} nghìn tỷ`;
  }
  if (abs >= 1_000_000_000) {
    const n = (abs / 1_000_000_000).toFixed(2).replace('.', ',');
    return `${sign}${n} tỷ`;
  }
  if (abs >= 1_000_000) {
    const n = (abs / 1_000_000).toFixed(1).replace('.', ',');
    return `${sign}${n} triệu`;
  }
  return `${sign}${formatVnNumber(val)} đ`;
}

