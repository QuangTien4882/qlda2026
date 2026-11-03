import React, { useState, useMemo } from 'react';
import { PlanTaskItem, PlanPhase, PlanStatus } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { AppBadge } from '../../common/AppBadge';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Bell, 
  AlertCircle, 
  ChevronRight, 
  Check, 
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface TabScheduleProps {
  projectId: string;
  planTasks: PlanTaskItem[];
  onAdd: (item: PlanTaskItem) => void;
  onUpdate: (item: PlanTaskItem) => void;
  onDelete: (id: string) => void;
}

// Hàm chuẩn hóa ngày hiển thị theo tiêu chuẩn Việt Nam
// Tháng 1, tháng 2 có số 0 (01, 02); Tháng 3 đến 12 không có số 0. Ngày 1 đến 9 có số 0.
export function formatVietnameseDate(d: Date): string {
  const day = d.getDate();
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const month = d.getMonth() + 1;
  const monthStr = month === 1 || month === 2 ? `0${month}` : `${month}`;
  const year = d.getFullYear();
  return `${dayStr}/${monthStr}/${year}`;
}

// Phân tích chuỗi ngày sang đối tượng Date
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim();

  // Định dạng dd/mm/yyyy hoặc d/m/yyyy
  const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    return new Date(year, month, day);
  }

  // Định dạng "Tháng MM/YYYY" hoặc "Tháng M/YYYY" (lấy ngày cuối cùng của tháng đó để so sánh hạn chót)
  const monthYear = s.match(/(?:Tháng\s*)?(\d{1,2})[\/\s]+(?:năm\s*)?(\d{4})/i);
  if (monthYear) {
    const month = parseInt(monthYear[1], 10); // 1-12
    const year = parseInt(monthYear[2], 10);
    // Ngày cuối cùng của tháng
    return new Date(year, month, 0);
  }

  // ISO yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Tính số ngày chênh lệch so với ngày hôm nay (0h00)
function getDaysDifference(targetDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export const TabSchedule: React.FC<TabScheduleProps> = ({
  projectId,
  planTasks,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanTaskItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PlanTaskItem | null>(null);

  // Modal thông báo việc gấp / Nhắc việc
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Form states
  const [stt, setStt] = useState(1);
  const [taskName, setTaskName] = useState('');
  const [phase, setPhase] = useState<PlanPhase>('Chuẩn bị đầu tư');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<PlanStatus>('Chưa thực hiện');
  const [note, setNote] = useState('');

  // Tự động tính STT tiếp theo
  const nextStt = useMemo(() => {
    return planTasks.length > 0 ? Math.max(...planTasks.map((t) => Number(t.stt) || 0)) + 1 : 1;
  }, [planTasks]);

  // Phân tích trạng thái trễ hạn & nhắc nhở đối soát thời gian thực
  const taskAlerts = useMemo(() => {
    const overdueList: { task: PlanTaskItem; diffDays: number }[] = [];
    const dueTodayList: { task: PlanTaskItem }[] = [];
    const upcomingList: { task: PlanTaskItem; diffDays: number }[] = [];
    const startDueList: { task: PlanTaskItem }[] = [];

    planTasks.forEach((task) => {
      if (task.status === 'Hoàn thành') return;

      const endD = parseDateString(task.endDate);
      if (endD) {
        const diff = getDaysDifference(endD);
        if (diff < 0) {
          overdueList.push({ task, diffDays: Math.abs(diff) });
        } else if (diff === 0) {
          dueTodayList.push({ task });
        } else if (diff <= 7) {
          upcomingList.push({ task, diffDays: diff });
        }
      }

      // Kiểm tra ngày bắt đầu nếu còn Chưa thực hiện
      if (task.status === 'Chưa thực hiện') {
        const startD = parseDateString(task.startDate);
        if (startD) {
          const diffStart = getDaysDifference(startD);
          if (diffStart <= 0 && (!endD || getDaysDifference(endD) >= 0)) {
            startDueList.push({ task });
          }
        }
      }
    });

    return {
      overdueList,
      dueTodayList,
      upcomingList,
      startDueList,
      totalUrgent: overdueList.length + dueTodayList.length,
    };
  }, [planTasks]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setStt(nextStt);
    setTaskName('');
    setPhase('Chuẩn bị đầu tư');
    setStartDate(formatVietnameseDate(new Date()));
    // Mặc định hạn chót là 30 ngày sau
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    setEndDate(formatVietnameseDate(defaultEnd));
    setStatus('Chưa thực hiện');
    setNote('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: PlanTaskItem) => {
    setEditingItem(item);
    setStt(item.stt);
    setTaskName(item.taskName);
    setPhase(item.phase);
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setStatus(item.status);
    setNote(item.note || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const record: PlanTaskItem = {
      id: editingItem ? editingItem.id : `tsk-${Date.now()}`,
      projectId,
      stt,
      taskName: taskName.trim(),
      phase,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      status,
      note: note.trim(),
    };

    if (editingItem) {
      onUpdate(record);
    } else {
      onAdd(record);
    }
    setModalOpen(false);
  };

  // 1-Click: Đánh dấu hoàn thành ngay lập tức
  const handleQuickComplete = (task: PlanTaskItem) => {
    onUpdate({
      ...task,
      status: 'Hoàn thành',
    });
  };

  // 1-Click: Chuyển sang đang thực hiện
  const handleQuickInProgress = (task: PlanTaskItem) => {
    onUpdate({
      ...task,
      status: 'Đang thực hiện',
    });
  };

  // 1-Click: Gia hạn thêm 15 ngày
  const handleQuickExtend = (task: PlanTaskItem) => {
    const endD = parseDateString(task.endDate) || new Date();
    const newEnd = new Date(endD);
    newEnd.setDate(newEnd.getDate() + 15);
    onUpdate({
      ...task,
      endDate: formatVietnameseDate(newEnd),
      note: task.note ? `${task.note} (Đã gia hạn 15 ngày)` : 'Gia hạn 15 ngày',
    });
  };

  // Helper render Trạng thái kèm Cảnh báo Deadline Realtime
  const renderStatusBadge = (item: PlanTaskItem) => {
    // 1. Nếu đã hoàn thành -> màu xanh lá
    if (item.status === 'Hoàn thành') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>Hoàn thành</span>
        </span>
      );
    }

    // 2. Kiểm tra ngày kết thúc / Hạn chót
    const endD = parseDateString(item.endDate);
    if (endD) {
      const diffDays = getDaysDifference(endD);

      // Quá hạn
      if (diffDays < 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-900/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <AlertTriangle size={13} className="text-rose-400" />
            <span>Quá hạn {Math.abs(diffDays)} ngày</span>
          </span>
        );
      }

      // Hôm nay là hạn chót
      if (diffDays === 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/60">
            <AlertCircle size={13} className="text-rose-400 animate-bounce" />
            <span>Hạn chót hôm nay!</span>
          </span>
        );
      }

      // Sắp đến hạn trong 7 ngày
      if (diffDays <= 7) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Clock size={13} className="text-amber-400" />
            <span>Còn {diffDays} ngày nữa</span>
          </span>
        );
      }
    }

    // 3. Nếu chưa hoàn thành và ngày bắt đầu đã đến mà vẫn "Chưa thực hiện"
    if (item.status === 'Chưa thực hiện') {
      const startD = parseDateString(item.startDate);
      if (startD && getDaysDifference(startD) <= 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertCircle size={12} className="text-amber-400" />
            <span>Đến ngày phải làm</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/30 text-slate-300 border border-slate-600/40">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Chưa thực hiện</span>
        </span>
      );
    }

    // 4. Đang thực hiện
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        <span>Đang thực hiện</span>
      </span>
    );
  };

  // Helper render Badge Giai đoạn
  const renderPhaseBadge = (p: PlanPhase) => {
    switch (p) {
      case 'Chuẩn bị đầu tư':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-700/50">
            Chuẩn bị đầu tư
          </span>
        );
      case 'Thực hiện đầu tư':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-700/50">
            Thực hiện đầu tư
          </span>
        );
      case 'Kết thúc xây dựng':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
            Kết thúc xây dựng
          </span>
        );
    }
  };

  // Cấu hình các cột theo yêu cầu:
  // 1. STT; 2. Nội dung công việc / Kế hoạch; 3. Giai đoạn; 4. Bắt đầu; 5. Kết thúc; 6. Trạng thái & Nhắc nhở; 7. Ghi chú
  const columns: AdvancedColumn<PlanTaskItem>[] = [
    {
      id: 'stt',
      title: 'STT',
      width: 60,
      minWidth: 25,
      align: 'center',
      pinned: true,
      render: (item) => <span className="font-mono text-slate-300 font-semibold">{item.stt}</span>,
    },
    {
      id: 'taskName',
      title: 'Nội dung công việc / Kế hoạch',
      width: 400,
      minWidth: 25,
      pinned: true,
      render: (item) => (
        <div className="py-0.5">
          <span className="text-slate-100 font-medium leading-relaxed">{item.taskName}</span>
        </div>
      ),
    },
    {
      id: 'phase',
      title: 'Giai đoạn',
      width: 160,
      minWidth: 25,
      align: 'center',
      render: (item) => renderPhaseBadge(item.phase),
    },
    {
      id: 'startDate',
      title: 'Thời gian bắt đầu / thực hiện',
      width: 180,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono text-slate-300 text-xs">{item.startDate || '—'}</span>
      ),
    },
    {
      id: 'endDate',
      title: 'Thời gian kết thúc / Hạn chót',
      width: 180,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono font-medium text-slate-200 text-xs">{item.endDate || '—'}</span>
      ),
    },
    {
      id: 'status',
      title: 'Trạng thái & Nhắc nhở',
      width: 220,
      minWidth: 25,
      align: 'center',
      render: (item) => renderStatusBadge(item),
    },
    {
      id: 'confirmDone',
      title: 'Xác nhận đã xong',
      width: 180,
      minWidth: 25,
      align: 'center',
      render: (item) => {
        const isDone = item.status === 'Hoàn thành';
        return (
          <div className="flex items-center justify-center">
            {isDone ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({
                    ...item,
                    status: 'Đang thực hiện',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 hover:bg-amber-500/20 text-emerald-300 hover:text-amber-300 border border-emerald-500/40 hover:border-amber-500/40 text-xs font-semibold transition-all group shadow-sm"
                title="Đã xác nhận xong. Bấm vào đây nếu muốn mở lại công việc (Chưa xong)"
              >
                <CheckCircle2 size={13} className="text-emerald-400 group-hover:hidden" />
                <RotateCcw size={13} className="text-amber-400 hidden group-hover:inline" />
                <span className="group-hover:hidden">Đã xong</span>
                <span className="hidden group-hover:inline">Mở lại</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickComplete(item);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111f38] hover:bg-emerald-600 border border-blue-500/40 hover:border-emerald-500 text-blue-200 hover:text-white text-xs font-medium transition-all shadow-sm group"
                title="Bấm vào đây để xác nhận công việc này đã thực hiện xong"
              >
                <span className="w-4 h-4 rounded-full border border-blue-400 group-hover:border-white flex items-center justify-center transition-colors shrink-0">
                  <Check size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span>Xác nhận đã xong</span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden space-y-2">
      {/* THANH CHUÔNG THÔNG BÁO & NHẮC NHỞ TIẾN ĐỘ THỜI GIAN THỰC */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 rounded-lg bg-[#0d1629] border border-[#1e2d4e]">
        <div className="flex items-center gap-3">
          {taskAlerts.totalUrgent > 0 ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <Bell size={14} className="text-rose-400" />
                <span>
                  NHẮC NHỞ TIẾN ĐỘ:{' '}
                  <strong className="text-white underline">
                    {taskAlerts.totalUrgent} công việc cần xử lý gấp
                  </strong>{' '}
                  ({taskAlerts.overdueList.length} quá hạn, {taskAlerts.dueTodayList.length} đến hạn hôm nay)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 size={15} />
              <span>
                {planTasks.length === 0
                  ? 'Chưa có công việc nào được lên kế hoạch. Bấm "Thêm mới" để bắt đầu lập tiến độ.'
                  : 'Tiến độ đúng hạn: Toàn bộ các công việc đang được kiểm soát tốt, không có việc trễ hạn.'}
              </span>
            </div>
          )}
        </div>

        {/* Nút Xem chi tiết nhắc việc */}
        <div className="flex items-center gap-2">
          {taskAlerts.totalUrgent > 0 && (
            <button
              type="button"
              onClick={() => setReminderModalOpen(true)}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-md shadow-rose-950/50 transition-colors"
            >
              <Bell size={13} />
              <span>Xem việc gấp & Xử lý nhanh ({taskAlerts.totalUrgent})</span>
            </button>
          )}

          <div className="text-[11px] text-slate-400 font-mono pl-2 border-l border-slate-700">
            Tổng cộng: <strong className="text-slate-200">{planTasks.length}</strong> công việc
          </div>
        </div>
      </div>

      {/* Bảng Kế hoạch (AdvancedTable) */}
      <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
        <AdvancedTable
          columns={columns}
          data={planTasks}
          keyExtractor={(item) => item.id}
          onAdd={handleOpenAdd}
          addLabel="Thêm mới"
          onEdit={handleOpenEdit}
          onDelete={(item) => setDeletingItem(item)}
          emptyMessage="Chưa có công việc nào trong kế hoạch. Bấm 'Thêm mới' ở góc trên để lập kế hoạch tiến độ dự án."
        />
      </div>

      {/* Modal Thêm Mới / Sửa Công Việc - Cấp 2 (Bằng 90% Cấp 1) */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Sửa Kế Hoạch Công Việc' : 'Thêm Mới Kế Hoạch Công Việc'}
        level={2}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <AppButton variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Hủy bỏ
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={handleSave}>
              {editingItem ? 'Lưu cập nhật' : 'Thêm công việc'}
            </AppButton>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs md:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">STT</label>
              <input
                type="number"
                value={stt}
                onChange={(e) => setStt(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 mb-1">
                Giai đoạn dự án <span className="text-rose-400">*</span>
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as PlanPhase)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="Chuẩn bị đầu tư">Chuẩn bị đầu tư</option>
                <option value="Thực hiện đầu tư">Thực hiện đầu tư</option>
                <option value="Kết thúc xây dựng">Kết thúc xây dựng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">
              Nội dung công việc / Kế hoạch <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Ví dụ: Tổ chức lựa chọn nhà thầu gói thầu xây lắp XL-01; Hoàn thiện hồ sơ nghiệm thu..."
              className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">
                Thời gian bắt đầu / thực hiện
              </label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Ví dụ: 18/01/2026 hoặc Tháng 10/2026"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                <span>Gợi ý:</span>
                <button
                  type="button"
                  onClick={() => setStartDate(formatVietnameseDate(new Date()))}
                  className="text-blue-400 hover:underline"
                >
                  Hôm nay
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(1);
                    setStartDate(formatVietnameseDate(d));
                  }}
                  className="text-blue-400 hover:underline"
                >
                  Đầu tháng
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Thời gian kết thúc / Hạn chót <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Ví dụ: 30/6/2026 hoặc 18/10/2026"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                <span>Gợi ý hạn:</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 15);
                    setEndDate(formatVietnameseDate(d));
                  }}
                  className="text-blue-400 hover:underline"
                >
                  +15 ngày
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 30);
                    setEndDate(formatVietnameseDate(d));
                  }}
                  className="text-blue-400 hover:underline"
                >
                  +30 ngày
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 3);
                    setEndDate(formatVietnameseDate(d));
                  }}
                  className="text-blue-400 hover:underline"
                >
                  +3 tháng
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Trạng thái công việc</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PlanStatus)}
              className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
            >
              <option value="Chưa thực hiện">Chưa thực hiện</option>
              <option value="Đang thực hiện">Đang thực hiện</option>
              <option value="Hoàn thành">Hoàn thành</option>
            </select>
          </div>
        </form>
      </AppModal>

      {/* Modal Xử Lý Nhanh Các Việc Gấp / Nhắc Việc Đến Hạn (Cấp 2) */}
      <AppModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-rose-300">
            <Bell size={18} className="text-rose-400 animate-bounce" />
            <span>Danh sách công việc đến hạn & Quá hạn cần giải quyết ngay</span>
          </div>
        }
        level={2}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-400">
              Bấm vào các nút thao tác nhanh để cập nhật trạng thái mà không cần mở form sửa.
            </div>
            <AppButton variant="secondary" size="sm" onClick={() => setReminderModalOpen(false)}>
              Đóng lại
            </AppButton>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Nhóm việc Quá hạn */}
          {taskAlerts.overdueList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wide">
                <AlertTriangle size={14} />
                <span>Công việc đã quá hạn ({taskAlerts.overdueList.length})</span>
              </div>
              <div className="space-y-2">
                {taskAlerts.overdueList.map(({ task, diffDays }) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-rose-950/30 border border-rose-600/40 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <span className="font-mono text-rose-400">#{task.stt}</span>
                        <span>{task.taskName}</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-3">
                        <span>Giai đoạn: <strong>{task.phase}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-rose-300 font-semibold">
                          Hạn chót: {task.endDate} (Trễ {diffDays} ngày)
                        </span>
                      </div>
                    </div>

                    {/* Cụm nút xử lý nhanh 1-click */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuickComplete(task)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 transition-colors"
                      >
                        <Check size={13} />
                        <span>Đã hoàn thành</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickExtend(task)}
                        className="px-2.5 py-1 rounded bg-[#162544] hover:bg-[#1f3560] border border-blue-500/40 text-blue-300 font-medium flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw size={12} />
                        <span>Gia hạn +15 ngày</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nhóm việc Hạn chót hôm nay */}
          {taskAlerts.dueTodayList.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <Clock size={14} />
                <span>Hôm nay là hạn chót ({taskAlerts.dueTodayList.length})</span>
              </div>
              <div className="space-y-2">
                {taskAlerts.dueTodayList.map(({ task }) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-amber-950/30 border border-amber-600/40 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <span className="font-mono text-amber-400">#{task.stt}</span>
                        <span>{task.taskName}</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-3">
                        <span>Giai đoạn: <strong>{task.phase}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-amber-300 font-semibold">
                          Hạn chót: Hôm nay ({task.endDate})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuickComplete(task)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 transition-colors"
                      >
                        <Check size={13} />
                        <span>Đã xong hôm nay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickExtend(task)}
                        className="px-2.5 py-1 rounded bg-[#162544] hover:bg-[#1f3560] border border-blue-500/40 text-blue-300 font-medium flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw size={12} />
                        <span>Gia hạn +15 ngày</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nhóm việc sắp đến hạn trong tuần */}
          {taskAlerts.upcomingList.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wide">
                <Calendar size={14} />
                <span>Sắp đến hạn trong 7 ngày tới ({taskAlerts.upcomingList.length})</span>
              </div>
              <div className="space-y-2">
                {taskAlerts.upcomingList.map(({ task, diffDays }) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-blue-950/20 border border-blue-800/40 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-slate-100 flex items-center gap-2">
                        <span className="font-mono text-blue-400">#{task.stt}</span>
                        <span>{task.taskName}</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-3">
                        <span>Hạn chót: <strong className="font-mono text-slate-300">{task.endDate}</strong></span>
                        <span>•</span>
                        <span className="text-amber-300">Còn {diffDays} ngày nữa</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuickComplete(task)}
                        className="px-2 py-1 rounded bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium text-xs flex items-center gap-1"
                      >
                        <Check size={12} />
                        <span>Hoàn thành sớm</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppModal>

      {/* Confirm xóa công việc */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) onDelete(deletingItem.id);
        }}
        title="Xóa công việc kế hoạch"
        message="Bạn có chắc chắn muốn xóa công việc này khỏi kế hoạch tiến độ dự án?"
      />
    </div>
  );
};

