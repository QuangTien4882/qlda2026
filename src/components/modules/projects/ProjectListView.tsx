import React, { useState, useEffect } from 'react';
import { ProjectListItem, ProjectDetailItem } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppBadge } from '../../common/AppBadge';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ProjectFormModal } from './ProjectFormModal';
import { formatVnNumber } from '../../../utils/numberUtils';
import { useSettings } from '../../../context/SettingsContext';
import { ExternalLink } from 'lucide-react';

interface ProjectListViewProps {
  projects: ProjectListItem[];
  projectDetails: Record<string, ProjectDetailItem>;
  onSelectProject: (projectId: string) => void;
  onAddProject: (project: ProjectListItem, detail: ProjectDetailItem) => void;
  onUpdateProject: (project: ProjectListItem, detail: ProjectDetailItem) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  projects,
  projectDetails,
  onSelectProject,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const { setHeaderTitle } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectListItem | null>(null);

  useEffect(() => {
    setHeaderTitle('BẢNG DANH MỤC CÁC DỰ ÁN ĐẦU TƯ XÂY DỰNG');
  }, [setHeaderTitle]);

  const handleEdit = (item: ProjectListItem) => {
    setEditingProject(item);
    setModalOpen(true);
  };

  const handleDelete = (item: ProjectListItem) => {
    setDeletingProject(item);
  };

  const handleSave = (project: ProjectListItem, detail: ProjectDetailItem) => {
    if (editingProject) {
      onUpdateProject(project, detail);
    } else {
      onAddProject(project, detail);
    }
    setEditingProject(null);
  };

  // Tự động tính STT tiếp theo: max(stt) + 1
  const nextStt =
    projects.length > 0 ? Math.max(...projects.map((p) => Number(p.stt) || 0)) + 1 : 1;

  // Cấu hình 7 cột chuẩn hóa đồng bộ cỡ chữ (text-sm)
  const columns: AdvancedColumn<ProjectListItem>[] = [
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
      id: 'code',
      title: 'Mã dự án',
      width: 140,
      minWidth: 25,
      align: 'center',
      pinned: true,
      render: (item) => (
        <span className="font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
          {item.code}
        </span>
      ),
    },
    {
      id: 'name',
      title: 'Tên dự án',
      width: 380,
      minWidth: 25,
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-2 group">
          <span className="font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
            {item.name}
          </span>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ),
    },
    {
      id: 'location',
      title: 'Địa điểm',
      width: 250,
      minWidth: 25,
      align: 'left',
      render: (item) => <span className="text-slate-200">{item.location}</span>,
    },
    {
      id: 'status',
      title: 'Trạng thái',
      width: 210,
      minWidth: 25,
      align: 'center',
      render: (item) => {
        const variant =
          item.status === 'Đang thực hiện'
            ? 'blue'
            : item.status === 'Chuẩn bị đầu tư'
            ? 'amber'
            : item.status === 'Hoàn thành chưa quyết toán'
            ? 'purple'
            : 'emerald';
        return <AppBadge variant={variant} dot>{item.status}</AppBadge>;
      },
    },
    {
      id: 'totalInvestment',
      title: 'Tổng mức đầu tư',
      unit: '(đồng)',
      width: 190,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatVnNumber(item.totalInvestment)}
        </span>
      ),
      searchValue: (item) => String(item.totalInvestment),
    },
    {
      id: 'note',
      title: 'Ghi chú',
      width: 240,
      minWidth: 25,
      align: 'left',
      render: (item) => <span className="text-slate-400">{item.note || '—'}</span>,
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      {/* Bảng Danh sách các dự án (Cấp 1) */}
      <AdvancedTable
        columns={columns}
        data={projects}
        keyExtractor={(item) => item.id}
        onAdd={() => {
          setEditingProject(null);
          setModalOpen(true);
        }}
        addLabel="Thêm mới"
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={(item) => onSelectProject(item.id)}
        emptyMessage="Chưa có dự án nào trong hệ thống. Bấm 'Thêm mới' ở góc trên để tạo dự án đầu tiên."
      />

      {/* Modal Thêm / Sửa dự án - Cấp 1 đầy đủ 18 trường thông tin */}
      <ProjectFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSave}
        initialData={editingProject}
        initialDetail={editingProject ? projectDetails[editingProject.id] : null}
        nextStt={nextStt}
      />

      {/* Dialog xác nhận xóa dự án - Cấp 3 */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={() => {
          if (deletingProject) {
            onDeleteProject(deletingProject.id);
            setDeletingProject(null);
          }
        }}
        title="Xác nhận xóa dự án"
        message={
          <div>
            Bạn có chắc chắn muốn xóa dự án{' '}
            <strong className="text-white">
              {deletingProject?.code} - {deletingProject?.name}
            </strong>
            ? Toàn bộ các dữ liệu dự toán, hợp đồng và nghiệm thu liên quan sẽ bị xóa.
          </div>
        }
      />
    </div>
  );
};
