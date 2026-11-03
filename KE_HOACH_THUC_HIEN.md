# KẾ HOẠCH THỰC HIỆN & ĐẶC TẢ BẮT BUỘC
# PHẦN MỀM QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG (OFFLINE)

> **LƯU Ý QUAN TRỌNG CHO TẤT CẢ CÁC PHIÊN LÀM VIỆC (AI AGENT & DEVELOPER):**
> Mọi thay đổi, cập nhật mã nguồn hoặc mở rộng tính năng trong các phiên làm việc tiếp theo **BẮT BUỘC PHẢI TUÂN THỦ TUYỆT ĐỐI** các quy tắc, định dạng dữ liệu và cơ cấu menu đã được quy định trong tài liệu này. Không được tự ý thay đổi hoặc bỏ qua bất kỳ yêu cầu nào.

---

## I. 7 NGUYÊN TẮC BẮT BUỘC CỐT LÕI

### 1. Giao diện Tối (Dark Mode) 100%
- Giao diện mặc định và bắt buộc là **Giao diện tối (Dark Mode)** trên toàn bộ các màn hình, cửa sổ, modal, popup, bảng biểu.
- Bảng màu: Slate/Zinc 900-950 (`#090d16`, `#0f172a`, `#1e293b`), viền phân cách tinh tế (`#334155`), chữ sáng tương phản chuẩn WCAG 2.1 AA (`#f8fafc`, `#cbd5e1`, `#94a3b8`). Dịu mắt, chống mỏi khi làm việc lâu trong mọi điều kiện ánh sáng.

### 2. Phân rã Modul lớn thành các Task nhỏ (WBS)
- Modul nào lớn bắt buộc phải phân tách thành các task nhỏ để theo dõi và thực hiện.
- Áp dụng trong phân hệ **Kế hoạch** của từng dự án: Chia theo 3 giai đoạn (Chuẩn bị đầu tư, Thực hiện đầu tư, Kết thúc xây dựng). Mỗi giai đoạn phân rã thành các **Task/Công việc nhỏ** với người phụ trách, thời hạn (kế hoạch vs thực tế), trọng số %, tỷ lệ % hoàn thành và trạng thái độc lập.

### 3. Giao diện Đồng bộ Toàn diện (Design System Dùng Chung)
- Toàn bộ giao diện phải sử dụng các bộ linh kiện dùng chung (Shared Components) đặt tại `@/components/common`:
  - `AppButton`: Nút bấm nhất quán các trạng thái (primary, secondary, danger, ghost, outline).
  - `AdvancedTable`: Bảng dữ liệu chuẩn cao cấp (header căn giữa & top, đơn vị nhảy dòng, resize cột không ảnh hưởng cột khác, ghim cột, tìm kiếm out-of-order, cuộn ngang).
  - `AppModal`: Hộp thoại modal dialog đồng bộ.
  - `AppCard`: Thẻ hiển thị nội dung viền tối đồng bộ.
  - `AppBadge`: Nhãn trạng thái (Màu sắc theo tiến độ, trạng thái hợp đồng, mức độ ưu tiên).
  - `AppTabs`: Thanh chuyển đổi tab đồng bộ.
  - `VnNumberInput`: Ô nhập số định dạng realtime.
  - `VnDateInput`: Ô nhập ngày chuẩn hóa đặc thù.
  - `ConfirmDialog`: Hộp thoại xác nhận thao tác xóa/sửa dữ liệu an toàn.

### 4. Font chữ & Cỡ chữ Tùy chỉnh Linh hoạt
- **Font mặc định**: `Be Vietnam Pro`.
- **Tùy chọn font**: Người dùng có thể chuyển đổi linh hoạt giữa 3 font: `Be Vietnam Pro`, `Roboto`, `Inter`.
- **Cỡ chữ**: Cho phép người dùng tùy chọn từ **12pt đến 18pt** (ví dụ 12pt, 13pt, 14pt, 15pt, 16pt, 17pt, 18pt).
- Khi thay đổi, toàn bộ giao diện phải lập tức co giãn kích thước chữ theo thời gian thực và lưu cấu hình vào bộ nhớ máy (`localStorage`/`IndexedDB`).

### 5. Dữ liệu Ngày Tháng Chuẩn Việt Nam Đặc Thù
- Định dạng bắt buộc: `"dd/mm/yyyy"`.
- **Quy tắc tháng**:
  - Tháng 1, tháng 2: **BẮT BUỘC có số 0 phía trước** $\rightarrow$ `01`, `02` (Ví dụ: `18/01/2026`, `18/02/2026`).
  - Tháng 3 đến tháng 12: **BẮT BUỘC KHÔNG có số 0 phía trước** $\rightarrow$ `3`, `4`, ..., `12` (Ví dụ: `18/3/2026`, `18/12/2026`).
- **Quy tắc ngày**:
  - Ngày 1 đến ngày 9: **BẮT BUỘC có số 0 phía trước** $\rightarrow$ `01`, `02`, ..., `09` (Ví dụ: `01/12/2026`, `09/12/2026`).
  - Ngày 10 trở đi: **BẮT BUỘC KHÔNG có số 0 phía trước** $\rightarrow$ `10`, `11`, ..., `31` (Ví dụ: `10/12/2026`, `18/12/2026`).
- Mọi hiển thị ngày tháng trên bảng, form nhập liệu, báo cáo, văn bản đều phải dùng hàm `formatCustomVnDate()`.

### 6. Dữ liệu Số Chuẩn Việt Nam & Định Dạng Realtime
- Phân cách hàng nghìn bằng **dấu chấm `.`**
- Phân cách số thập phân bằng **dấu phẩy `,`**
- **Định dạng REALTIME ngay khi nhập liệu**: Khi người dùng gõ phím, giá trị tự động định dạng ngay lập tức (Ví dụ gõ `1250000` $\rightarrow$ hiện `1.250.000`; gõ `1250000,5` $\rightarrow$ hiện `1.250.000,5`) để kiểm soát dữ liệu đầu vào.
- Con trỏ chuột không bị nhảy lung tung khi tự động chèn dấu chấm.

### 7. Đa Nền Tảng (PC & Điện Thoại), Mọi Độ Phân Giải, 100% Offline
- **Chạy 100% Offline**: Không phụ thuộc internet, không phụ thuộc server ngoài.
- **Trên Máy tính (PC)**:
  - Có thể đóng gói thành **Bộ cài đặt (`Setup.exe`)** hoặc **Bản Portable chạy ngay từ thư mục/USB không cần cài đặt**.
  - Đọc/ghi trực tiếp vào file dữ liệu `du_lieu_du_an.json` lưu trong thư mục **Google Drive** trên máy tính (ví dụ: `D:\Google Drive\ProjectM\du_lieu_du_an.json`) để Google Drive for Desktop tự động đồng bộ lên mây.
- **Trên Điện thoại**:
  - Responsive mượt mà trên mọi độ phân giải (375px, 414px, 768px, 1920px...).
  - Đi kèm file trình xem di động độc lập (`ProjectM-Mobile.html`) hoặc quét mã QR Wifi nội bộ để tra cứu số liệu bất cứ lúc nào từ Google Drive.

---

## II. QUY CHUẨN BẮT BUỘC CHO TẤT CẢ CÁC BẢNG (TABLE SPECIFICATIONS)

Toàn bộ các bảng trong hệ thống phải tuân thủ nghiêm ngặt 4 yêu cầu sau:

1. **Header của Bảng**:
   - Căn giữa (`text-align: center`) và căn trên (`vertical-align: top`).
   - Các dòng có đơn vị (ví dụ như `đồng`, `%`, ...): chuỗi đơn vị **bắt buộc phải nhảy dòng** so với text tiêu đề (kiểu như sử dụng `Alt+Enter` trong Excel, ví dụ: dòng 1 `Tổng mức đầu tư`, dòng 2 `(đồng)`).
2. **Kéo giãn (Resize) Cột Độc Lập**:
   - Người dùng có thể kéo thả mép cột để thay đổi độ rộng cột.
   - **Khi resize một cột thì KHÔNG ĐƯỢC ẢNH HƯỞNG đến các cột khác** (độ rộng các cột khác giữ nguyên).
   - Nếu mở rộng cột mà kích thước vượt quá màn hình thì **phải xuất hiện thanh cuộn ngang (horizontal scrollbar)** chứ **tuyệt đối không được co hẹp các cột khác**.
3. **Tìm Kiếm Thông Minh Không Cần Theo Thứ Tự (Out-of-order Search)**:
   - Tại mỗi bảng có ô tìm kiếm dữ liệu.
   - Khi người dùng nhập nhiều từ khóa (ví dụ: `trường xây`), chỉ cần hàng đó có chứa từ `xây` và từ `trường` thì lập tức hiển thị, không phân biệt thứ tự gõ trước sau và không phân biệt chữ hoa chữ thường.
4. **Thao Tác Dữ Liệu (CRUD) & Ghim Cột (Freeze Columns)**:
   - Có đầy đủ các nút: **Thêm mới dữ liệu**, **Sửa dữ liệu**, **Xóa dữ liệu** (với form modal chuẩn, số định dạng realtime, ngày chọn chuẩn VN, hộp thoại xác nhận khi xóa).
   - Có chức năng **Ghim cột (Pin/Freeze column)**: Cho phép người dùng ghim các cột quan trọng (như STT, Mã dự án, Tên dự án...) cố định ở bên trái khi cuộn ngang bảng nhiều cột.

---

## III. ĐẶC TẢ CHI TIẾT PHÂN HỆ 1: "DANH MỤC DỰ ÁN"

Phân hệ Danh mục dự án gồm 2 cấp màn hình:

### Cấp 1: Bảng Danh Sách Các Dự Án
Hiển thị khi người dùng bấm vào "Danh mục dự án" ở menu chính:
- **STT**: Số thứ tự
- **Mã dự án**: Mã hiệu dự án (ví dụ: `DA-2026/01`)
- **Tên dự án**: Tên đầy đủ của dự án
- **Địa điểm**: Địa điểm thực hiện dự án
- **Trạng thái**: Chọn 1 trong 4 trạng thái:
  - `Chuẩn bị đầu tư`
  - `Đang thực hiện`
  - `Hoàn thành chưa quyết toán`
  - `Quyết toán`
- **Tổng mức đầu tư (đồng)**: Định dạng chuẩn Việt Nam realtime
- **Ghi chú**: Ghi chú tự do
- *Chức năng*: Tìm kiếm không theo thứ tự, Thêm dự án, Sửa dự án, Xóa dự án, Ghim cột, Bấm vào 1 dự án để mở chi tiết 6 tab.

---

### Cấp 2: Màn Hình Chi Tiết Dự Án (6 Tab Nghiệp Vụ)
Khi bấm vào một dự án cụ thể, hệ thống hiển thị chi tiết gồm 6 tab:

#### 1. Tab "Dự án" (Thông tin chi tiết dự án):
Gồm các trường thông tin:
1. **STT**: Số thứ tự
2. **Mã dự án**: Mã hiệu dự án
3. **Tên dự án**: Tên dự án
4. **Địa điểm**: Địa điểm xây dựng
5. **Quy mô đầu tư**: Tóm tắt quy mô công trình
6. **Trạng thái**: Chọn trong: `Chuẩn bị đầu tư` | `Đang thực hiện` | `Hoàn thành chưa quyết toán` | `Quyết toán`
7. **Nhóm dự án**: Chọn trong: `Nhóm A` | `Nhóm B` | `Nhóm C`
8. **Loại dự án**: Chọn trong: `Giao thông` | `Hạ tầng kỹ thuật` | `Phục vụ NN & MT` | `Công nghiệp` | `Dân dụng`
9. **Cấp công trình**: Chọn trong: `Cấp I` | `Cấp II` | `Cấp III` | `Cấp IV`
10. **CP BT, HT & TĐC (đồng)**: Chi phí bồi thường, hỗ trợ và tái định cư
11. **CP Xây dựng (đồng)**: Chi phí xây dựng
12. **CP Thiết bị (đồng)**: Chi phí thiết bị
13. **CP QLDA (đồng)**: Chi phí quản lý dự án
14. **CP TVĐTXD (đồng)**: Chi phí tư vấn đầu tư xây dựng
15. **CP Khác (đồng)**: Chi phí khác
16. **CP Dự phòng (đồng)**: Chi phí dự phòng
17. **Tổng mức đầu tư (đồng)**: Tự động cộng tổng 7 chi phí hoặc nhập liệu kiểm tra
18. **Quyết định phê duyệt**: Số hiệu và trích yếu quyết định duyệt dự án
19. **Ghi chú**: Ghi chú thêm

#### 2. Tab "Dự toán":
Quản lý danh sách các công trình/hạng mục thuộc dự toán:
1. **STT**: Số thứ tự
2. **Tên công trình/Hạng mục**: Tên hạng mục công trình
3. **Loại công trình**: Chọn trong: `Giao thông` | `Hạ tầng kỹ thuật` | `Phục vụ NN & MT` | `Công nghiệp` | `Dân dụng`
4. **Cấp công trình**: Chọn trong: `Cấp I` | `Cấp II` | `Cấp III` | `Cấp IV`
5. **CP Xây dựng (đồng)**
6. **CP Thiết bị (đồng)**
7. **CP QLDA (đồng)**
8. **CP TVĐTXD (đồng)**
9. **CP Khác (đồng)**
10. **CP Dự phòng (đồng)**
11. **Tổng dự toán (đồng)**: Tự động tính tổng các chi phí
12. **Quyết định phê duyệt**: Số quyết định duyệt dự toán
13. **Ghi chú**: Ghi chú

#### 3. Tab "Nội dung chi phí":
Quản lý kế hoạch lựa chọn nhà thầu và hợp đồng thực hiện:
1. **STT**: Số thứ tự
2. **Nội dung chi phí**: Tên gói thầu / nội dung công việc
3. **Trạng thái**: Chọn trong: `Chưa thực hiện` | `Đang thực hiện` | `Hoàn thành`
4. **Khoản mục**: Chọn trong: `TVXD` (Tư vấn xây dựng) | `XD` (Xây lắp) | `K` (Khác)
5. **Loại chi phí**: Chọn trong: `Chi phí` | `Phí`
6. **Đơn vị thực hiện**: Tên nhà thầu / đơn vị trúng thầu
7. **Giá trị dự toán (đồng)**: Giá gói thầu theo dự toán duyệt
8. **Giá trị hợp đồng (đồng)**: Giá trị hợp đồng đã ký
9. **Tỷ lệ giảm thầu (%)**: Tự động tính = `(Dự toán - Hợp đồng) / Dự toán * 100%`
10. **Thời gian LCNT**: Thời gian tổ chức lựa chọn nhà thầu (ví dụ: Quý I/2026)
11. **Hình thức LCNT**: Chọn trong: `Chỉ định thầu rút gọn` | `Chỉ định thầu` | `Đấu thầu rộng rãi`
12. **Phương thức LCNT**: Chọn trong:
    - `Không áp dụng`
    - `01 giai đoạn 01 túi hồ sơ`
    - `01 giai đoạn 02 túi hồ sơ`
    - `02 giai đoạn 01 túi hồ sơ`
    - `02 giai đoạn 02 túi hồ sơ`
13. **Số HĐ**: Số hiệu hợp đồng (ví dụ: `18/2026/HĐ-XD`)
14. **Ngày ký HĐ**: Định dạng theo chuẩn Việt Nam đặc thù
15. **Loại HĐ**: Chọn trong: `Trọn gói` | `Đơn giá cố định` | `Đơn giá điều chỉnh`
16. **Thời gian thực hiện HĐ**: Thời gian thực hiện (ví dụ: `180 ngày` hoặc `18/01/2026 - 18/12/2026`)
17. **PLHĐ**: Phụ lục hợp đồng điều chỉnh (nếu có)
18. **Ghi chú**: Ghi chú

#### 4. Tab "Nghiệm thu":
Theo dõi giá trị nghiệm thu và thanh toán từng đợt:
1. **STT**: Số thứ tự
2. **Tên gói thầu**: Gói thầu tương ứng
3. **Đợt NT**: Đợt nghiệm thu (ví dụ: `Đợt 1`, `Đợt 2`...)
4. **Ngày NT**: Ngày nghiệm thu theo chuẩn Việt Nam đặc thù
5. **Giá trị NT (đồng)**: Giá trị khối lượng công việc hoàn thành được nghiệm thu
6. **Giá trị TT (đồng)**: Giá trị thực thanh toán cho nhà thầu
7. **Tỷ lệ NT/TT (%)**: Tự động tính = `(Giá trị NT / Giá trị TT) * 100%`
8. **Ghi chú**: Ghi chú

#### 5. Tab "Hồ sơ pháp lý":
Lưu trữ danh mục hồ sơ pháp lý:
1. **STT**: Số thứ tự
2. **Nội dung**: Trích yếu, số văn bản, cơ quan ban hành, nội dung hồ sơ pháp lý
3. **Ghi chú**: Ghi chú

#### 6. Tab "Kế hoạch":
- **Trạng thái**: *Chưa triển khai* (theo chỉ đạo của người dùng). Hiển thị card thông báo chuẩn mực, sẵn sàng tích hợp khi triển khai giai đoạn sau.
