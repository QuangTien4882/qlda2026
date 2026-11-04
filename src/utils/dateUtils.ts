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

/**
 * Trích xuất số ngày thực hiện hợp đồng từ chuỗi nhập liệu (VD: "180 ngày", "6 tháng", "180")
 */
export function parseContractExecutionDays(timeStr: string | number | undefined | null): number {
  if (timeStr === undefined || timeStr === null) return 0;
  if (typeof timeStr === 'number') return Math.max(0, Math.round(timeStr));

  const clean = timeStr.trim().toLowerCase();
  if (!clean) return 0;

  // Trường hợp nhập theo tháng: "6 tháng", "12 thang"
  if (clean.includes('tháng') || clean.includes('thang')) {
    const match = clean.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10) * 30;
    }
  }

  // Trường hợp nhập theo năm: "1 năm", "2 nam"
  if (clean.includes('năm') || clean.includes('nam')) {
    const match = clean.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10) * 365;
    }
  }

  // Mặc định bóc tách số ngày (VD: "180 ngày", "90 ngay", "120")
  const match = clean.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export type DeadlineStatus = 'overdue' | 'urgent' | 'warning' | 'normal' | 'unknown' | 'completed' | 'not_applicable';

export interface ContractDeadlineInfo {
  contractDateStr: string;
  contractDate: Date | null;
  baseDays: number;
  additionalDays: number;
  totalDays: number;
  deadlineDate: Date | null;
  deadlineStr: string;
  remainingDays: number; // Âm: đã quá hạn X ngày, Dương: còn X ngày
  status: DeadlineStatus;
  statusText: string;
}

/**
 * Tính toán ngày hết hạn hợp đồng và trạng thái cảnh báo
 * Công thức: Hạn chót = Ngày ký + Thời gian thực hiện gốc + Ngày gia hạn từ PLHĐ
 */
export function calculateContractDeadline(
  contractDateStr: string | undefined | null,
  executionDaysStrOrNum: string | number | undefined | null,
  additionalDays: number = 0,
  isCompleted: boolean = false,
  isFee: boolean = false
): ContractDeadlineInfo {
  if (isFee) {
    return {
      contractDateStr: contractDateStr || '',
      contractDate: null,
      baseDays: 0,
      additionalDays: 0,
      totalDays: 0,
      deadlineDate: null,
      deadlineStr: '',
      remainingDays: 0,
      status: 'not_applicable',
      statusText: 'Không áp dụng đối với Phí',
    };
  }

  if (isCompleted) {
    return {
      contractDateStr: contractDateStr || '',
      contractDate: null,
      baseDays: 0,
      additionalDays: 0,
      totalDays: 0,
      deadlineDate: null,
      deadlineStr: '',
      remainingDays: 0,
      status: 'completed',
      statusText: 'Hợp đồng đã hoàn thành',
    };
  }

  const baseDays = parseContractExecutionDays(executionDaysStrOrNum);
  const totalDays = baseDays + (Number(additionalDays) || 0);

  if (!contractDateStr || totalDays <= 0) {
    return {
      contractDateStr: contractDateStr || '',
      contractDate: null,
      baseDays,
      additionalDays,
      totalDays,
      deadlineDate: null,
      deadlineStr: '',
      remainingDays: 0,
      status: 'unknown',
      statusText: 'Chưa đủ thông tin tính hạn',
    };
  }

  const startDate = parseCustomVnDate(contractDateStr);
  if (!startDate) {
    return {
      contractDateStr: contractDateStr || '',
      contractDate: null,
      baseDays,
      additionalDays,
      totalDays,
      deadlineDate: null,
      deadlineStr: '',
      remainingDays: 0,
      status: 'unknown',
      statusText: 'Ngày ký không đúng định dạng',
    };
  }

  // Hạn chót = startDate + totalDays ngày
  const deadlineDate = new Date(startDate.getTime());
  deadlineDate.setDate(deadlineDate.getDate() + totalDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
  const diffTime = target.getTime() - today.getTime();
  const remainingDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let status: DeadlineStatus = 'normal';
  let statusText = `Còn ${remainingDays} ngày`;

  if (remainingDays < 0) {
    status = 'overdue';
    statusText = `Quá hạn ${Math.abs(remainingDays)} ngày`;
  } else if (remainingDays <= 15) {
    status = 'urgent';
    statusText = `Khẩn cấp: Còn ${remainingDays} ngày`;
  } else if (remainingDays <= 30) {
    status = 'warning';
    statusText = `Lưu ý: Còn ${remainingDays} ngày`;
  } else {
    status = 'normal';
    statusText = `Còn ${remainingDays} ngày`;
  }

  return {
    contractDateStr,
    contractDate: startDate,
    baseDays,
    additionalDays,
    totalDays,
    deadlineDate,
    deadlineStr: formatCustomVnDate(deadlineDate),
    remainingDays,
    status,
    statusText,
  };
}

/**
 * Tính toán ngày hết hạn hợp đồng có tính đến tất cả các Phụ lục Hợp đồng (PLHĐ).
 * Ưu tiên tuyệt đối: Thời điểm gia hạn (extendedDate hoặc ngày dạng dd/mm/yyyy trong newExecutionTime) của PLHĐ.
 * Nếu không có thời điểm gia hạn cụ thể, mới dùng tổng số ngày gia hạn cộng dồn.
 */
export function getPackageEffectiveDeadline(
  pkg: {
    contractDate?: string | null;
    executionTime?: string | number | null;
    status?: string | null;
    costType?: string | null;
  },
  appendices: Array<{
    adjustmentType?: string;
    extendedDate?: string;
    adjustmentDays?: number;
    newExecutionTime?: string;
  }> = []
): ContractDeadlineInfo {
  if (pkg.costType === 'Phí') {
    return {
      contractDateStr: pkg.contractDate || '',
      contractDate: null,
      baseDays: 0,
      additionalDays: 0,
      totalDays: 0,
      deadlineDate: null,
      deadlineStr: '',
      remainingDays: 0,
      status: 'not_applicable',
      statusText: 'Không áp dụng đối với Phí',
    };
  }

  if (pkg.status === 'Hoàn thành') {
    return {
      contractDateStr: pkg.contractDate || '',
      contractDate: null,
      baseDays: 0,
      additionalDays: 0,
      totalDays: 0,
      deadlineDate: null,
      deadlineStr: '',
      remainingDays: 0,
      status: 'completed',
      statusText: 'Hợp đồng đã hoàn thành',
    };
  }

  // 1. Tìm các phụ lục có điều chỉnh tiến độ
  const timeAppendices = appendices.filter(
    (a) => a.adjustmentType === 'Tiến độ' || a.adjustmentType === 'Giá trị & Tiến độ'
  );

  // 2. Tìm thời điểm gia hạn cụ thể (extendedDate hoặc chuỗi ngày trong newExecutionTime)
  let latestExtendedDate: Date | null = null;
  let latestExtendedDateStr = '';

  for (const app of timeAppendices) {
    let candidateStr = app.extendedDate?.trim() || '';
    if (!candidateStr && app.newExecutionTime) {
      // Tìm mẫu ngày dd/mm/yyyy trong newExecutionTime (ví dụ: "31/12/2026" hoặc "Đến ngày 31/12/2026")
      const match = app.newExecutionTime.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
      if (match) {
        candidateStr = match[0];
      }
    }

    if (candidateStr) {
      const parsed = parseCustomVnDate(candidateStr);
      if (parsed) {
        if (!latestExtendedDate || parsed.getTime() > latestExtendedDate.getTime()) {
          latestExtendedDate = parsed;
          latestExtendedDateStr = formatCustomVnDate(parsed);
        }
      }
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 3. NẾU CÓ THỜI ĐIỂM GIA HẠN CỤ THỂ TỪ PLHĐ: DÙNG TRỰC TIẾP LÀM HẠN CHÓT
  if (latestExtendedDate) {
    const target = new Date(latestExtendedDate.getFullYear(), latestExtendedDate.getMonth(), latestExtendedDate.getDate());
    const diffTime = target.getTime() - today.getTime();
    const remainingDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let status: DeadlineStatus = 'normal';
    let statusText = `Còn ${remainingDays} ngày`;

    if (remainingDays < 0) {
      status = 'overdue';
      statusText = `Quá hạn ${Math.abs(remainingDays)} ngày`;
    } else if (remainingDays <= 15) {
      status = 'urgent';
      statusText = `Khẩn cấp: Còn ${remainingDays} ngày`;
    } else if (remainingDays <= 30) {
      status = 'warning';
      statusText = `Lưu ý: Còn ${remainingDays} ngày`;
    } else {
      status = 'normal';
      statusText = `Còn ${remainingDays} ngày`;
    }

    return {
      contractDateStr: pkg.contractDate || '',
      contractDate: parseCustomVnDate(pkg.contractDate || '') || null,
      baseDays: parseContractExecutionDays(pkg.executionTime),
      additionalDays: 0,
      totalDays: 0,
      deadlineDate: latestExtendedDate,
      deadlineStr: latestExtendedDateStr,
      remainingDays,
      status,
      statusText,
    };
  }

  // 4. NẾU KHÔNG CÓ THỜI ĐIỂM CỤ THỂ: Tính theo số ngày gia hạn cộng dồn
  const additionalDays = timeAppendices.reduce((sum, a) => sum + (Number(a.adjustmentDays) || 0), 0);
  return calculateContractDeadline(
    pkg.contractDate,
    pkg.executionTime,
    additionalDays,
    pkg.status === 'Hoàn thành',
    pkg.costType === 'Phí'
  );
}

