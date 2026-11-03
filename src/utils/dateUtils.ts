/**
 * Tiện ích xử lý Ngày Tháng theo Quy chuẩn Việt Nam đặc thù:
 * - Chuẩn: "dd/mm/yyyy"
 * - Tháng 1, 2 có số 0 trước: "01", "02"
 * - Tháng 3 đến 12 không có số 0 trước: "3" đến "12"
 * - Ngày 1 đến 9 có số 0 trước: "01" đến "09"
 * - Ngày 10 đến 31 không có số 0 trước: "10" đến "31"
 * 
 * Ví dụ hợp lệ:
 *  - 18/01/2026
 *  - 18/02/2026
 *  - 18/3/2026
 *  - 18/12/2026
 *  - 01/12/2026
 *  - 09/12/2026
 */

export function formatCustomVnDate(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';

  let date: Date;
  if (typeof dateInput === 'string') {
    // Nếu đã ở dạng dd/mm/yyyy rồi thì chuẩn hóa lại
    if (dateInput.includes('/')) {
      const parsed = parseCustomVnDate(dateInput);
      if (parsed) date = parsed;
      else date = new Date(dateInput);
    } else {
      date = new Date(dateInput);
    }
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) return '';

  const day = date.getDate();
  const month = date.getMonth() + 1; // 1 -> 12
  const year = date.getFullYear();

  // Quy tắc ngày: 1-9 có số 0, 10 trở đi không có số 0
  const dayStr = day < 10 ? `0${day}` : `${day}`;

  // Quy tắc tháng: 1, 2 có số 0; 3-12 không có số 0
  const monthStr = (month === 1 || month === 2) ? `0${month}` : `${month}`;

  return `${dayStr}/${monthStr}/${year}`;
}

export function parseCustomVnDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Chuyển sang định dạng ISO yyyy-mm-dd cho HTML input type="date"
 */
export function toIsoDateString(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  let date: Date;
  if (typeof dateInput === 'string') {
    const parsed = parseCustomVnDate(dateInput);
    date = parsed || new Date(dateInput);
  } else {
    date = dateInput;
  }
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Chuyển từ ISO yyyy-mm-dd sang chuỗi ngày chuẩn Việt Nam đặc thù
 */
export function fromIsoToCustomVnDate(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return '';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m - 1, d);
  return formatCustomVnDate(date);
}

