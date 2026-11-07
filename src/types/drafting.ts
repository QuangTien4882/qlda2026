/**
 * Types cho Module Soạn Thảo Văn Bản (.docx)
 * Dựa trên kiến trúc SmartDocs, tối ưu cho ProjectM offline-first
 */

// Loại biến hỗ trợ trong template
export type VariableType =
  | 'text'                 // Văn bản ngắn
  | 'long_text'            // Đoạn văn bản (có xuống dòng)
  | 'number'               // Số (format VN: 1.000.000)
  | 'number_to_words'      // Đọc số thành chữ tự động
  | 'date'                 // Ngày (dd/mm/yyyy)
  | 'formula'              // Công thức tính toán
  | 'dropdown'             // Danh sách chọn tĩnh
  | 'dependent_dropdown'   // Danh sách chọn phụ thuộc
  | 'project'              // Chọn dự án từ DB
  | 'contractor'           // Chọn nhà thầu từ DB
  | 'cost_package'         // Chọn gói thầu / nội dung chi phí từ dự án
  | 'legal_doc'            // Chọn hồ sơ pháp lý từ dự án
  | 'project_dependent'    // Tự động lấy field từ dự án đã chọn
  | 'contractor_dependent' // Tự động lấy field từ nhà thầu đã chọn
  | 'cost_package_dependent' // Tự động lấy field từ Nội dung chi phí
  | 'legal_doc_dependent'   // Tự động lấy field từ Hồ sơ pháp lý
  | 'joint_venture'        // Biến liên danh (clone block)
  | 'table';               // Bảng động (docxtemplater loop)

// Định nghĩa 1 biến trong template
export interface TemplateVariable {
  id: string;
  name: string;              // Tên biến (unique trong template)
  label: string;              // Nhãn hiển thị cho user
  type: VariableType;
  value: string;              // Giá trị hiện tại
  originalText: string;       // Text gốc trong .docx đã bôi đen
  originalTexts?: string[];   // Danh sách các text gốc tại nhiều vị trí khác nhau (khi gắn vào nhiều nơi)
  occurrenceIndex?: number;   // Vị trí xuất hiện (nếu text trùng)

  // Cho dropdown
  optionsStr?: string;        // "Lựa chọn 1,Lựa chọn 2,..."

  // Cho dependent_dropdown / project_dependent / contractor_dependent / number_to_words
  sourceVariableId?: string;  // ID biến cha
  dependentConfig?: string;   // Config chuỗi phụ thuộc

  // Cho formula
  formulaExpression?: string; // "{{bien_a}} + {{bien_b}}"

  // Cho joint_venture
  jvField?: string;           // Field mapping (company_name, representative, ...)

  // Cho long_text
  paragraphIndent?: string;   // Thụt đầu dòng (cm)
}

// Thành viên liên danh
export interface JVMember {
  id: string;
  company_name: string;
  representative: string;
  position: string;
  address: string;
  tax_code: string;
  bank_account: string;
  bank_name: string;
  registration_date: string;
  phone: string;
  email: string;
  _custom_fields: Record<string, string>;
  [key: string]: unknown; // dynamic field access
}

// Thư mục template
export interface TemplateFolder {
  id: string;
  name: string;
  createdAt: string;
}

// Template văn bản
export interface DocTemplate {
  id: string;
  name: string;
  folderId: string;
  variables: TemplateVariable[];
  previewHtml?: string;       // HTML cache từ docx-preview
  fileBase64?: string;        // File .docx lưu dạng Base64
  fileName?: string;          // Tên file gốc
  isDraft?: boolean;          // Đánh dấu bản thảo (user tự lưu)
  createdAt: string;
  updatedAt: string;
}

// Bản thảo đã lưu (user đang soạn dở)
export interface DraftDocument {
  id: string;
  templateId: string;         // Template gốc
  projectId: string;          // Dự án đã chọn
  name: string;               // Tên bản thảo
  variables: TemplateVariable[];
  jvMembers?: JVMember[];
  createdAt: string;
  updatedAt: string;
}

// Toàn bộ dữ liệu module soạn thảo (để lưu vào IDB và JSON export)
export interface DraftingDatabase {
  templateFolders: TemplateFolder[];
  docTemplates: DocTemplate[];
  draftDocuments: DraftDocument[];
}

