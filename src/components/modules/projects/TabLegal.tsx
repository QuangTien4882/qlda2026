import React, { useState, useRef, useEffect } from 'react';
import { LegalDocItem } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { renderAsync } from 'docx-preview';
import { 
  FileText, 
  Paperclip, 
  Upload, 
  Eye, 
  Download, 
  X, 
  Check, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Info,
  Maximize2
} from 'lucide-react';

/** Chuyển Data URL (Base64) sang Blob URL để Chrome có thể hiển thị PDF trong iframe mà không bị chặn */
function dataUrlToBlobUrl(dataUrl: string): string {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return dataUrl;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Lỗi chuyển data URL sang blob URL:', err);
    return dataUrl;
  }
}

/** Chuyển Data URL base64 sang ArrayBuffer để docx-preview render */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(pureBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

interface TabLegalProps {
  legalDocs: LegalDocItem[];
  projectId: string;
  projectCode?: string;
  projectName?: string;
  onAdd: (item: LegalDocItem) => void;
  onUpdate: (item: LegalDocItem) => void;
  onDelete: (id: string) => void;
}

export const TabLegal: React.FC<TabLegalProps> = ({
  legalDocs,
  projectId,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LegalDocItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LegalDocItem | null>(null);

  // Xem trước file TOÀN MÀN HÌNH (Fullscreen)
  const [previewDoc, setPreviewDoc] = useState<LegalDocItem | null>(null);

  // Form states
  const [stt, setStt] = useState(legalDocs.length + 1);
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Blob URLs & docx preview refs
  const [modalBlobUrl, setModalBlobUrl] = useState<string>('');
  const [fullscreenBlobUrl, setFullscreenBlobUrl] = useState<string>('');
  const docxModalContainerRef = useRef<HTMLDivElement>(null);
  const docxFullscreenContainerRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tạo và quản lý Blob URL cho khung xem trước trong Modal
  useEffect(() => {
    if (!fileUrl) {
      setModalBlobUrl('');
      return;
    }
    if (fileUrl.startsWith('data:')) {
      const blobUrl = dataUrlToBlobUrl(fileUrl);
      setModalBlobUrl(blobUrl);
      return () => {
        URL.revokeObjectURL(blobUrl);
      };
    } else {
      setModalBlobUrl(fileUrl);
    }
  }, [fileUrl]);

  // Tạo và quản lý Blob URL cho khung xem trước Toàn màn hình
  useEffect(() => {
    if (!previewDoc?.fileUrl) {
      setFullscreenBlobUrl('');
      return;
    }
    if (previewDoc.fileUrl.startsWith('data:')) {
      const blobUrl = dataUrlToBlobUrl(previewDoc.fileUrl);
      setFullscreenBlobUrl(blobUrl);
      return () => {
        URL.revokeObjectURL(blobUrl);
      };
    } else {
      setFullscreenBlobUrl(previewDoc.fileUrl);
    }
  }, [previewDoc]);

  // Render Word .docx trong Modal Thêm/Sửa
  useEffect(() => {
    if (modalOpen && fileUrl && (fileType === 'docx' || fileName.toLowerCase().endsWith('.docx'))) {
      if (docxModalContainerRef.current) {
        docxModalContainerRef.current.innerHTML = '';
        try {
          const buf = base64ToArrayBuffer(fileUrl);
          renderAsync(buf, docxModalContainerRef.current, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
          });
        } catch (err) {
          console.warn('Lỗi render docx trong modal:', err);
        }
      }
    }
  }, [modalOpen, fileUrl, fileType, fileName]);

  // Render Word .docx trong Fullscreen Preview
  useEffect(() => {
    if (previewDoc?.fileUrl && (previewDoc.fileType === 'docx' || previewDoc.fileName?.toLowerCase().endsWith('.docx'))) {
      if (docxFullscreenContainerRef.current) {
        docxFullscreenContainerRef.current.innerHTML = '';
        try {
          const buf = base64ToArrayBuffer(previewDoc.fileUrl);
          renderAsync(buf, docxFullscreenContainerRef.current, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
          });
        } catch (err) {
          console.warn('Lỗi render docx fullscreen:', err);
        }
      }
    }
  }, [previewDoc]);

  // Lắng nghe phím ESC để đóng xem toàn màn hình
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewDoc) {
        setPreviewDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewDoc]);

  const handleOpenAdd = () => {
    const nextStt =
      legalDocs.length > 0 ? Math.max(...legalDocs.map((l) => Number(l.stt) || 0)) + 1 : 1;
    setEditingItem(null);
    setStt(nextStt);
    setContent('');
    setFileName('');
    setFileSize('');
    setFileType('');
    setFileUrl('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: LegalDocItem) => {
    setEditingItem(item);
    setStt(item.stt);
    setContent(item.content);
    setFileName(item.fileName || '');
    setFileSize(item.fileSize || '');
    setFileType(item.fileType || (item.fileName ? item.fileName.split('.').pop()?.toLowerCase() || '' : ''));
    setFileUrl(item.fileUrl || '');
    setModalOpen(true);
  };

  // Xử lý chọn file thực tế từ ổ đĩa máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const sizeMb = file.size / (1024 * 1024);
    const formattedSize = sizeMb >= 1 ? `${sizeMb.toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
    setFileSize(formattedSize);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setFileType(ext);

    // Đọc file thành Data URL (Base64) để lưu bền vững vào database (không bị mất khi F5)
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachedFile = () => {
    setFileName('');
    setFileSize('');
    setFileType('');
    setFileUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const record: LegalDocItem = {
      id: editingItem ? editingItem.id : `leg-${Date.now()}`,
      projectId,
      stt,
      content: content.trim(),
      fileName: fileName.trim(),
      fileSize: fileSize || undefined,
      fileType: fileType || (fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : undefined),
      fileUrl: fileUrl || undefined,
    };

    if (editingItem) {
      onUpdate(record);
    } else {
      onAdd(record);
    }
    setModalOpen(false);
  };

  // Tính năng Tải file về máy tính
  const handleDownloadFile = (doc: LegalDocItem) => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.fileName || 'van-ban.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([
        `HỒ SƠ PHÁP LÝ DỰ ÁN\n` +
        `Nội dung: ${doc.content}\n` +
        `Tên file: ${doc.fileName || 'Chưa đính kèm'}\n` +
        `Ngày trích xuất: ${new Date().toLocaleString('vi-VN')}`
      ], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (doc.fileName || 'Trich_Yeu_Ho_So') + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Helper render icon loại file
  const renderFileIcon = (name?: string, type?: string) => {
    const ext = (type || name?.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') {
      return <FileText size={15} className="text-rose-400 shrink-0" />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText size={15} className="text-blue-400 shrink-0" />;
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return <FileSpreadsheet size={15} className="text-emerald-400 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      return <ImageIcon size={15} className="text-purple-400 shrink-0" />;
    }
    return <Paperclip size={15} className="text-amber-400 shrink-0" />;
  };

  // Cấu hình các cột theo yêu cầu:
  // STT; Nội dung; File (Đã loại bỏ Ghi chú, Zalo, Windows Share)
  const columns: AdvancedColumn<LegalDocItem>[] = [
    {
      id: 'stt',
      title: 'STT',
      width: 65,
      minWidth: 25,
      align: 'center',
      pinned: true,
      render: (item) => <span className="font-mono text-slate-300 font-semibold">{item.stt}</span>,
    },
    {
      id: 'content',
      title: 'Nội dung hồ sơ pháp lý',
      width: 680,
      minWidth: 25,
      pinned: true,
      render: (item) => (
        <div className="flex items-start gap-2.5 py-0.5">
          <FileText size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <span className="text-slate-100 font-medium leading-relaxed">{item.content}</span>
        </div>
      ),
    },
    {
      id: 'fileName',
      title: 'Tệp đính kèm (File)',
      width: 380,
      minWidth: 25,
      render: (item) => (
        item.fileName ? (
          <div className="space-y-1.5 py-0.5 max-w-full">
            {/* Tên file & định dạng */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#101b33] border border-blue-500/30 text-blue-200 font-mono text-xs max-w-full">
              {renderFileIcon(item.fileName, item.fileType)}
              <span className="truncate max-w-[240px] font-medium" title={item.fileName}>
                {item.fileName}
              </span>
              {item.fileSize && (
                <span className="text-[10px] text-slate-400 ml-1 shrink-0 font-sans">
                  ({item.fileSize})
                </span>
              )}
            </div>

            {/* Cụm nút thao tác Xem file toàn màn hình & Tải về */}
            <div className="flex items-center gap-2 pt-0.5">
              {/* Nút 1: Xem file toàn màn hình */}
              <button
                type="button"
                onClick={() => setPreviewDoc(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-600/50 text-blue-300 text-xs font-medium transition-colors shadow-sm"
                title="Mở xem toàn màn hình (Fullscreen)"
              >
                <Maximize2 size={13} className="text-blue-400" />
                <span>Xem toàn màn hình</span>
              </button>

              {/* Nút 2: Tải về máy */}
              <button
                type="button"
                onClick={() => handleDownloadFile(item)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs transition-colors"
                title="Tải tệp tin về máy tính"
              >
                <Download size={13} />
                <span>Tải về</span>
              </button>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 italic text-xs">Chưa đính kèm file</span>
        )
      ),
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden relative">
      {/* Bảng hồ sơ pháp lý */}
      <AdvancedTable
        tableId="tab_legal"
        columns={columns}
        data={legalDocs}
        keyExtractor={(item) => item.id}
        onAdd={handleOpenAdd}
        addLabel="Thêm mới"
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="Chưa có hồ sơ pháp lý nào. Bấm 'Thêm mới' ở góc trên để tạo hồ sơ và đính kèm file."
      />

      {/* Modal Thêm / Sửa - Cấp 2 */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Sửa Hồ Sơ Pháp Lý' : 'Thêm Mới Hồ Sơ Pháp Lý'}
        level={2}
        maxWidth="full"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <AppButton variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Hủy bỏ
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={handleSave}>
              {editingItem ? 'Lưu cập nhật' : 'Thêm hồ sơ'}
            </AppButton>
          </div>
        }
      >
        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[580px] flex-1">
          {/* Cột trái: Form nhập liệu */}
          <form onSubmit={handleSave} className="w-full lg:w-[350px] shrink-0 space-y-4 text-xs md:text-sm flex flex-col justify-between overflow-y-auto pr-1">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1">STT</label>
                <input
                  type="number"
                  value={stt}
                  onChange={(e) => setStt(parseInt(e.target.value, 10) || 1)}
                  onFocus={(e) => e.target.select()}
                  className="w-24 bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  Nội dung hồ sơ pháp lý <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập số hiệu văn bản, ngày ban hành, cơ quan ban hành và trích yếu nội dung..."
                  className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 resize-none leading-relaxed placeholder:italic placeholder:text-slate-500"
                />
              </div>

              {/* Khu vực Chọn & Đính kèm File thực tế */}
              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">
                  Tệp văn bản đính kèm (PDF, Word, Excel, Bản scan...)
                </label>

                {/* Input ẩn phục vụ click chọn file */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.rar"
                  className="hidden"
                />

                {fileName ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e172a] border border-blue-500/40">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded bg-blue-950 text-blue-400 shrink-0">
                        {renderFileIcon(fileName, fileType)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-100 truncate font-mono">
                          {fileName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Kích thước: {fileSize || 'Không rõ'}</span>
                          <span>•</span>
                          <span className="uppercase text-blue-300 font-mono">{fileType || 'FILE'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded bg-[#17243e] hover:bg-[#1e3054] text-blue-300 text-xs border border-blue-600/30 transition-colors"
                      >
                        Đổi file khác
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveAttachedFile}
                        className="p-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 transition-colors"
                        title="Gỡ file đính kèm"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#263554] hover:border-blue-500/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#080d1a]/60 hover:bg-[#0c1426]"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-950/80 border border-blue-700/40 text-blue-400 mx-auto flex items-center justify-center mb-2">
                      <Upload size={18} />
                    </div>
                    <div className="text-xs font-medium text-slate-200">
                      Bấm vào đây để chọn tệp tin từ máy tính của bạn
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Hỗ trợ định dạng PDF, Word (.docx), Excel (.xlsx), hình ảnh quyết định (.jpg, .png)
                    </div>
                  </div>
                )}

                {/* Cho phép gõ hoặc chỉnh sửa thủ công tên file nếu muốn */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 shrink-0">Hoặc sửa tên file:</span>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Ví dụ: QD-456-QDPD-UBND.pdf"
                    className="flex-1 bg-[#080d1a] border border-[#232f4e] rounded px-2.5 py-1 text-slate-200 font-mono text-xs placeholder:italic placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Cột phải: Khung xem trước văn bản đính kèm - Kéo dài tối đa diện tích */}
          <div className="flex-1 min-h-[500px] border border-[#232f4e] rounded-xl bg-[#080d1a] flex flex-col overflow-hidden h-full">
            <div className="bg-[#0c1424] px-4 py-2.5 border-b border-[#232f4e] flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-2 truncate">
                <Eye size={15} className="text-blue-400 shrink-0" />
                <span>Xem trước văn bản đính kèm</span>
                {fileName && <span className="text-blue-300 font-mono text-xs font-normal truncate max-w-sm">({fileName})</span>}
              </span>
              {fileName && fileUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDoc({
                      id: editingItem ? editingItem.id : 'temp',
                      projectId,
                      stt,
                      content: content || 'Xem trước văn bản',
                      fileName,
                      fileSize,
                      fileType,
                      fileUrl,
                    });
                  }}
                  className="px-2.5 py-1 rounded bg-[#17243e] hover:bg-[#1e3054] text-blue-300 text-xs border border-blue-600/30 transition-colors flex items-center gap-1.5 font-medium shrink-0"
                >
                  <Maximize2 size={13} /> Xem toàn màn hình
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col bg-[#070b16]">
              {fileUrl ? (
                fileType === 'pdf' || fileName?.toLowerCase().endsWith('.pdf') ? (
                  modalBlobUrl ? (
                    <iframe
                      src={`${modalBlobUrl}#toolbar=1&navpanes=0&view=FitH`}
                      className="w-full h-full border-0 bg-slate-900"
                      title="Xem trước PDF"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                      Đang chuẩn bị tệp PDF...
                    </div>
                  )
                ) : ['png', 'jpg', 'jpeg', 'webp'].includes(fileType || '') ||
                  /\.(png|jpe?g|webp)$/i.test(fileName || '') ? (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-black/40 overflow-auto">
                    <img
                      src={fileUrl}
                      alt={fileName}
                      className="max-h-full max-w-full object-contain rounded shadow-lg"
                    />
                  </div>
                ) : fileType === 'docx' || fileName?.toLowerCase().endsWith('.docx') ? (
                  <div className="w-full h-full overflow-auto bg-[#7c8394] p-4 flex justify-center">
                    <div ref={docxModalContainerRef} className="w-full max-w-3xl bg-white shadow-xl rounded" />
                  </div>
                ) : (
                  <div className="m-auto text-center space-y-3 p-6 max-w-sm">
                    <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-600/50 text-blue-400 mx-auto flex items-center justify-center shadow-lg">
                      {renderFileIcon(fileName, fileType)}
                    </div>
                    <p className="text-sm font-bold text-slate-200 font-mono">{fileName}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Định dạng ({fileType?.toUpperCase()}) được hỗ trợ tải về máy để mở trực tiếp bằng Microsoft Office.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-950/40 border border-blue-800/30 text-blue-400 flex items-center justify-center">
                    <FileText size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Chưa có văn bản đính kèm để xem trước</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                      Bấm vào khung chọn file ở bên trái để tải lên tệp PDF, Word hoặc ảnh scan quyết định. Toàn bộ nội dung sẽ hiển thị tại đây để bạn tiện theo dõi và trích yếu.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppModal>

      {/* ========================================================================= */}
      {/* KHUNG XEM TRƯỚC TÀI LIỆU TOÀN MÀN HÌNH (FULLSCREEN OVERLAY)                */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#040711] flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Header toàn màn hình */}
          <div className="shrink-0 h-14 bg-[#0a1122] border-b border-[#1e2d4e] px-4 flex items-center justify-between gap-4 select-none">
            {/* Thông tin văn bản */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-blue-950/90 border border-blue-600/50 text-blue-400 shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm truncate font-mono">
                    {previewDoc.fileName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[11px] border border-blue-800 shrink-0">
                    {previewDoc.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}
                  </span>
                  {previewDoc.fileSize && (
                    <span className="text-slate-400 text-xs font-mono shrink-0">
                      ({previewDoc.fileSize})
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-300 truncate max-w-3xl">
                  <span className="text-slate-400 font-medium">Trích yếu:</span> {previewDoc.content}
                </div>
              </div>
            </div>

            {/* Các nút công cụ trong chế độ toàn màn hình */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadFile(previewDoc)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md shadow-blue-950/60"
                title="Tải tệp tin về máy tính"
              >
                <Download size={13} />
                <span>Tải về máy</span>
              </button>

              <div className="h-6 w-px bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/90 text-slate-200 hover:text-white border border-slate-700 transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                title="Đóng xem toàn màn hình (Phím Esc)"
              >
                <X size={16} />
                <span>Đóng (Esc)</span>
              </button>
            </div>
          </div>

          {/* Nội dung xem tài liệu chiếm 100% diện tích màn hình còn lại */}
          <div className="flex-1 w-full h-[calc(100vh-56px)] min-h-0 bg-[#070b16] relative overflow-hidden flex flex-col">
            {previewDoc.fileUrl ? (
              previewDoc.fileType === 'pdf' || previewDoc.fileName?.toLowerCase().endsWith('.pdf') ? (
                // PDF Viewer toàn màn hình 100% bằng Blob URL
                fullscreenBlobUrl ? (
                  <iframe
                    src={fullscreenBlobUrl}
                    className="w-full h-full border-0 bg-slate-900"
                    title={previewDoc.fileName}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                    Đang nạp tệp PDF...
                  </div>
                )
              ) : ['png', 'jpg', 'jpeg', 'webp'].includes(previewDoc.fileType || '') ||
                /\.(png|jpe?g|webp)$/i.test(previewDoc.fileName || '') ? (
                // Image Viewer toàn màn hình
                <div className="w-full h-full p-4 flex items-center justify-center overflow-auto bg-black/60">
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.fileName}
                    className="max-h-full max-w-full object-contain rounded shadow-2xl"
                  />
                </div>
              ) : previewDoc.fileType === 'docx' || previewDoc.fileName?.toLowerCase().endsWith('.docx') ? (
                // Docx viewer bằng docx-preview
                <div className="w-full h-full overflow-auto bg-[#7c8394] p-6 flex justify-center">
                  <div
                    ref={docxFullscreenContainerRef}
                    className="w-full max-w-4xl bg-white shadow-2xl rounded"
                  />
                </div>
              ) : (
                // File Word / Excel / ZIP
                <div className="m-auto text-center space-y-4 px-6 max-w-lg">
                  <div className="w-20 h-20 rounded-2xl bg-blue-950/80 border border-blue-600/50 text-blue-400 mx-auto flex items-center justify-center shadow-xl">
                    {renderFileIcon(previewDoc.fileName, previewDoc.fileType)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-100 font-mono">
                      {previewDoc.fileName}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Định dạng ({previewDoc.fileType?.toUpperCase()}) được thiết kế để mở tốt nhất bằng ứng dụng Microsoft Office trên máy tính của bạn.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(previewDoc)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors shadow-xl shadow-blue-900/40"
                  >
                    <Download size={16} /> Mở / Tải tệp về máy tính
                  </button>
                </div>
              )
            ) : (
              // Tài liệu số hóa mẫu hệ thống
              <div className="flex-1 w-full overflow-auto p-8 flex justify-center items-start bg-[#0a0e1c]">
                <div className="w-full max-w-3xl p-10 bg-white text-slate-900 rounded-xl shadow-2xl space-y-6 font-serif my-4">
                  <div className="text-center space-y-1 border-b border-slate-300 pb-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </div>
                    <div className="text-xs font-semibold underline underline-offset-4 text-slate-700">
                      Độc lập - Tự do - Hạnh phúc
                    </div>
                  </div>

                  <div className="space-y-3 py-4">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Số hiệu / Tệp: <strong>{previewDoc.fileName}</strong></span>
                      <span>Lưu trữ Ban QLDA</span>
                    </div>
                    <h2 className="text-base font-bold text-center uppercase text-slate-900 leading-snug pt-3">
                      {previewDoc.content}
                    </h2>
                  </div>

                  <div className="p-4 rounded-lg border border-blue-300 bg-blue-50 text-slate-700 text-xs font-sans space-y-2">
                    <div className="flex items-center justify-between font-semibold text-blue-900">
                      <span className="flex items-center gap-1.5">
                        <Check size={16} className="text-blue-600" /> TÀI LIỆU ĐÃ SỐ HÓA - BAN QUẢN LÝ DỰ ÁN
                      </span>
                      <span className="font-mono text-[11px] bg-blue-200 px-2 py-0.5 rounded">
                        PROJECTM OFFLINE
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 leading-relaxed">
                      Đây là văn bản điện tử trong hệ thống. Để xem toàn văn quyết định gốc có đóng dấu đỏ dưới dạng trang PDF thực tế, bạn chỉ cần bấm nút <strong>"Chọn tệp"</strong> khi sửa hồ sơ này để tải file PDF thật từ máy tính lên.
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 font-sans">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(previewDoc)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download size={14} /> Tải văn bản
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm xóa */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) onDelete(deletingItem.id);
        }}
        title="Xóa hồ sơ pháp lý"
        message="Bạn có chắc muốn xóa hồ sơ pháp lý này?"
      />
    </div>
  );
};
