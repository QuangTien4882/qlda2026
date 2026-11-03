// Các danh mục chuẩn theo yêu cầu nghiệp vụ
export type ProjectStatus = 
  | 'Chuẩn bị đầu tư' 
  | 'Đang thực hiện' 
  | 'Hoàn thành chưa quyết toán' 
  | 'Quyết toán';

export type ProjectGroup = 'Nhóm A' | 'Nhóm B' | 'Nhóm C';

export type ProjectType = 
  | 'Giao thông' 
  | 'Hạ tầng kỹ thuật' 
  | 'Phục vụ NN & MT' 
  | 'Công nghiệp' 
  | 'Dân dụng';

export type ProjectLevel = 'Cấp I' | 'Cấp II' | 'Cấp III' | 'Cấp IV';

// 1. Cấp 1: Danh sách các dự án
export interface ProjectListItem {
  id: string;
  stt: number;
  code: string; // Mã dự án
  name: string; // Tên dự án
  location: string; // Địa điểm
  status: ProjectStatus; // Trạng thái
  totalInvestment: number; // Tổng mức đầu tư (đồng)
  note?: string; // Ghi chú
}

// 2. Tab 1: Dự án (Thông tin chi tiết dự án & 7 chi phí)
export interface ProjectDetailItem {
  id: string;
  projectId: string; // ID dự án liên kết
  stt: number;
  code: string; // Mã dự án
  name: string; // Tên dự án
  location: string; // Địa điểm
  scale: string; // Quy mô đầu tư
  status: ProjectStatus; // Trạng thái
  group: ProjectGroup; // Nhóm dự án (A, B, C)
  type: ProjectType; // Loại dự án
  level: ProjectLevel; // Cấp công trình
  costCompensation: number; // CP BT, HT & TĐC (đồng)
  costConstruction: number; // CP Xây dựng (đồng)
  costEquipment: number; // CP Thiết bị (đồng)
  costManagement: number; // CP QLDA (đồng)
  costConsulting: number; // CP TVĐTXD (đồng)
  costOthers: number; // CP Khác (đồng)
  costContingency: number; // CP Dự phòng (đồng)
  totalInvestment: number; // Tổng mức đầu tư (đồng)
  approvalDecision: string; // Quyết định phê duyệt
  note?: string; // Ghi chú
}

// 3. Tab 2: Dự toán
export interface EstimateItem {
  id: string;
  projectId: string;
  stt: number;
  workName: string; // Tên công trình / Hạng mục
  workType: ProjectType; // Loại công trình
  workLevel: ProjectLevel; // Cấp công trình
  costConstruction: number; // CP Xây dựng (đồng)
  costEquipment: number; // CP Thiết bị (đồng)
  costManagement: number; // CP QLDA (đồng)
  costConsulting: number; // CP TVĐTXD (đồng)
  costOthers: number; // CP Khác (đồng)
  costContingency: number; // CP Dự phòng (đồng)
  totalEstimate: number; // Tổng dự toán (đồng)
  approvalDecision: string; // Quyết định phê duyệt
  note?: string; // Ghi chú
}

// 4. Tab 3: Nội dung chi phí
export type CostStatus = 'Chưa thực hiện' | 'Đang thực hiện' | 'Hoàn thành';
export type CostCategory = 'TVXD' | 'XD' | 'K';
export type CostType = 'Chi phí' | 'Phí';
export type BiddingForm = 'Chỉ định thầu rút gọn' | 'Chỉ định thầu' | 'Đấu thầu rộng rãi';
export type BiddingMethod = 
  | 'Không áp dụng'
  | '01 giai đoạn 01 túi hồ sơ'
  | '01 giai đoạn 02 túi hồ sơ'
  | '02 giai đoạn 01 túi hồ sơ'
  | '02 giai đoạn 02 túi hồ sơ';
export type ContractType = 'Trọn gói' | 'Đơn giá cố định' | 'Đơn giá điều chỉnh';

export interface CostPackageItem {
  id: string;
  projectId: string;
  stt: number;
  content: string; // Nội dung chi phí
  status: CostStatus; // Trạng thái
  category: CostCategory; // Khoản mục (TVXD; XD; K)
  costType: CostType; // Loại chi phí (Chi phí; Phí)
  contractor: string; // Đơn vị thực hiện
  estimateValue: number; // Giá trị dự toán (đồng)
  contractValue: number; // Giá trị hợp đồng (đồng)
  discountRate: number; // Tỷ lệ giảm thầu (%)
  biddingTime: string; // Thời gian LCNT
  biddingForm: BiddingForm; // Hình thức LCNT
  biddingMethod: BiddingMethod; // Phương thức LCNT
  contractNumber: string; // Số HĐ
  contractDate: string; // Ngày ký HĐ (chuẩn VN đặc thù)
  contractType: ContractType; // Loại HĐ
  executionTime: string; // Thời gian thực hiện HĐ
  contractAppendix: string; // PLHĐ
  note?: string; // Ghi chú
}

// 5. Tab 4: Nghiệm thu
export interface InspectionItem {
  id: string;
  projectId: string;
  costPackageId?: string; // ID gói thầu liên kết thuộc Tab Nội dung chi phí
  contractValue?: number; // Giá trị hợp đồng của gói thầu (để kiểm soát vượt hạn mức)
  stt: number;
  packageName: string; // Tên gói thầu
  inspectionRound: string; // Đợt NT (Đợt 1, Đợt 2...)
  inspectionDate: string; // Ngày NT (chuẩn VN đặc thù)
  inspectionValue: number; // Giá trị NT (đồng)
  paymentValue: number; // Giá trị TT (đồng)
  ratio: number; // Tỷ lệ TT/NT (%)
  note?: string; // Ghi chú
}

// 6. Tab 5: Hồ sơ pháp lý
export interface LegalDocItem {
  id: string;
  projectId: string;
  stt: number;
  content: string; // Nội dung
  fileName?: string; // Tên file đính kèm (Quyết định, biên bản...)
  fileSize?: string; // Kích thước file (ví dụ: 1.5 MB)
  fileType?: string; // Loại file (pdf, docx, xlsx, png, jpg)
  fileUrl?: string; // Đường dẫn xem trước (Data URL / Object URL)
  note?: string; // Ghi chú
}

// 7. Tab 6: Kế hoạch (Tinh gọn theo chỉ đạo: bỏ người thực hiện, trọng số, tỷ lệ %)
export type PlanPhase = 'Chuẩn bị đầu tư' | 'Thực hiện đầu tư' | 'Kết thúc xây dựng';
export type PlanStatus = 'Chưa thực hiện' | 'Đang thực hiện' | 'Hoàn thành';

export interface PlanTaskItem {
  id: string;
  projectId: string;
  stt: number;
  taskName: string; // Nội dung công việc / Kế hoạch
  phase: PlanPhase; // Giai đoạn
  startDate: string; // Thời gian bắt đầu / thực hiện (dd/mm/yyyy hoặc tháng/năm)
  endDate: string; // Thời gian kết thúc / Hạn chót (dd/mm/yyyy)
  status: PlanStatus; // Trạng thái
  note?: string; // Ghi chú
}

// Giữ lại alias cho ProjectTask để tương thích
export type ProjectPhase = PlanPhase;
export type TaskStatus = 'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành' | 'Chậm tiến độ' | 'Tạm dừng';
export interface ProjectTask {
  id: string;
  projectId: string;
  phase: string;
  taskCode: string;
  name: string;
  assignee: string;
  startDate: string;
  endDate: string;
  actualEndDate?: string;
  weightPercent: number;
  progressPercent: number;
  status: TaskStatus;
  notes?: string;
}

// 8. Phân hệ Danh mục nhà thầu (13 trường dữ liệu chuẩn theo yêu cầu)
export interface ContractorItem {
  id: string;
  stt: number; // 1. STT
  name: string; // 2. Tên nhà thầu
  address: string; // 3. Địa chỉ
  taxCode: string; // 4. Mã số thuế
  representative: string; // 5. Người đại diện
  position: string; // 6. Chức vụ
  bankAccount: string; // 7. Số tài khoản
  bankName: string; // 8. Tên ngân hàng
  registrationPlace: string; // 9. Nơi cấp ĐKKD
  registrationDate: string; // 10. Ngày cấp ĐKKD (chuẩn VN đặc thù)
  phone: string; // 11. Điện thoại
  fax?: string; // 12. Fax
  email: string; // 13. Email
  shortName?: string; // Tên viết tắt
  type?: string; // Lĩnh vực hoạt động
  note?: string; // Ghi chú
}

export type CompanyInfo = ContractorItem;

// 9. Khoản mục chi tiết cấu thành 7 loại chi phí (Dự án & Dự toán)
export type SevenCostCategory = 
  | 'costCompensation' // CP BT, HT & TĐC
  | 'costConstruction' // CP Xây dựng
  | 'costEquipment'    // CP Thiết bị
  | 'costManagement'   // CP QLDA
  | 'costConsulting'   // CP TVĐTXD
  | 'costOthers'       // CP Khác
  | 'costContingency';  // CP Dự phòng

export interface CostBreakdownItem {
  id: string;
  projectId: string;
  parentId: string; // ID của ProjectDetail hoặc EstimateItem
  costCategory: SevenCostCategory; // Thuộc loại chi phí nào trong 7 loại
  stt: number;
  name: string; // Tên khoản mục chi tiết
  amount: number; // Giá trị thành tiền (đồng)
  note?: string; // Ghi chú / Căn cứ định mức / Tỷ lệ %
}

// Menu chính
export type MainMenuType = 'projects' | 'reports' | 'drafting' | 'companies';

// 6 Tab chi tiết của một dự án
export type ProjectDetailTabType = 
  | 'tab_project'     // 1. Dự án
  | 'tab_estimates'   // 2. Dự toán
  | 'tab_costs'       // 3. Nội dung chi phí
  | 'tab_inspections' // 4. Nghiệm thu
  | 'tab_legal'       // 5. Hồ sơ pháp lý
  | 'tab_plan';       // 6. Kế hoạch (Chưa triển khai)

// Aliases cho tương thích ngược
export type ProjectInfo = ProjectListItem;
export type ProjectSubTab = string;
export type CostEstimateItem = EstimateItem;
export type PackageContract = CostPackageItem;
export type InspectionPayment = InspectionItem;
export type LegalDocument = LegalDocItem;
