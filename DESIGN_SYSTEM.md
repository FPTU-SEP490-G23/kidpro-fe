# KIDPRO System - Bộ Quy Chuẩn Thiết Kế (Design System)

> **Tài liệu quy chuẩn chính thức của Hệ sinh thái Quản trị Mầm non KIDPRO**  
> **Phiên bản:** 1.0.0 (Đồng bộ nhận diện thương hiệu)  
> **Nguyên tắc cốt lõi:** *"Trẻ em là trung tâm - Phụ huynh an tâm - Giáo viên thuận tiện - Dữ liệu minh bạch"*  
> ⚠️ **QUY TẮC BẮT BUỘC:** Mọi phiên làm việc (Coding Session), AI Assistant và lập trình viên **BẮT BUỘC PHẢI ĐỌC LẠI** tài liệu này trước khi tạo mới hoặc hiệu chỉnh bất kỳ giao diện người dùng (UI/UX) nào trong dự án.

---

## 1. BẢNG MÀU THƯƠNG HIỆU (BRAND COLOR PALETTE & DESIGN TOKENS)

Hệ màu của KIDPRO được phát triển đồng bộ từ bản mẫu nhận diện mầm non KIDPRO, kết hợp sắc thái tự nhiên, an toàn của rừng xanh với sự ấm áp, vui tươi của lứa tuổi mầm non:

| Tên Màu | Mã HEX | Vai Trò & Ứng Dụng Trong Hệ Thống | Lớp Tailwind CSS Tương Ứng |
| :--- | :--- | :--- | :--- |
| **Primary Forest Green** | `#275A4E` | **Màu chủ đạo chính (Primary Brand)**: Dùng cho Header chính, thanh điều hướng Navbar/Sidebar, nút bấm hành động chính (Primary CTA Buttons), trạng thái kích hoạt (Active tab). Tượng trưng cho sự an toàn, tự nhiên, tin cậy và phát triển bền vững. | `bg-[#275A4E]` / `text-[#275A4E]` / `bg-forest` |
| **Deep Brand Green** | `#1E4D40` | **Xanh thương hiệu đậm (Deep Brand)**: Dùng cho Hero Banner nền sâu, trạng thái Hover của nút chính, Footer, thanh tiêu đề phân hệ quan trọng và các khối nhận diện thương hiệu trang trọng. | `bg-[#1E4D40]` / `hover:bg-[#1E4D40]` / `bg-forest-deep` |
| **Warm Gold Accent** | `#E5A93C` | **Vàng kim ấm áp (Warm Gold Accent)**: Dùng cho Badge huy hiệu nổi bật, icon danh hiệu, điểm thưởng bé ngoan, sao đánh giá, nút hành động phụ (Secondary Highlight), thông báo vinh danh hoặc điểm nhấn cảm xúc. | `bg-[#E5A93C]` / `text-[#E5A93C]` / `bg-gold` |
| **Mint Green Highlight** | `#78C2AD` | **Xanh bạc hà (Mint Green Highlight)**: Dùng cho trạng thái thành công (Success), thẻ tag học sinh đã có mặt, viền khung nhận diện AI Camera khớp danh tính, thanh tiến trình hoàn thành và các vùng tương tác tích cực. | `bg-[#78C2AD]` / `border-[#78C2AD]` / `bg-mint` |

### 1.1. Bảng Màu Ngữ Nghĩa & Chức Năng (Semantic / Functional Colors)

Để đảm bảo an toàn tuyệt đối trong môi trường mầm non, hệ màu chức năng tuân theo quy tắc thị giác tức thì:

- 🔴 **Cảnh Báo Đỏ Khẩn Cấp (`#DC2626` / `#EF4444` - Danger / Allergy Alert):**
  - Dành riêng cho: **Cảnh báo trẻ dị ứng thực phẩm nặng**, báo động y tế khẩn cấp, học sinh chưa có người đón sau 18h00, sự cố ATVSTP.
  - Hiển thị: Luôn đi kèm icon cảnh báo nổi bật (`AlertTriangle`, `AlertOctagon`), viền dày và nền đỏ nhạt (`bg-rose-50 border-rose-400 text-rose-800`).
- 🟡 **Cảnh Báo Vàng Lưu Ý (`#D97706` / `#F59E0B` - Warning):**
  - Dành cho: Đơn xin nghỉ học chờ duyệt, cảnh báo trễ hạn học phí, nhắc nhở lịch tiêm chủng, đổi thực đơn tạm thời.
- 🟢 **Xác Nhận Thành Công (`#10B981` / `#78C2AD` - Success):**
  - Dành cho: Điểm danh vào lớp hợp lệ, giao dịch thanh toán VietQR thành công, kiểm thực thực phẩm đạt tiêu chuẩn 3 bước.
- ⚪ **Màu Nền & Bề Mặt Trung Tính (Surface & Neutrals):**
  - Nền trang (Page Canvas): `bg-slate-50` (`#F8FAFC`) hoặc `bg-[#F4F7F5]` tạo cảm giác mát mẻ, dịu mắt.
  - Card & Container: `bg-white` với bo góc mềm mại (`rounded-2xl` hoặc `rounded-3xl`), đổ bóng nhẹ `shadow-sm shadow-slate-200/50`.
  - Văn bản chính (Body Text): `text-slate-800` (`#1E293B`) cho độ tương phản sắc nét; phụ đề: `text-slate-500` (`#64748B`).

---

## 2. NGUYÊN TẮC TRẢI NGHIỆM GIÁO DỤC (UX PRINCIPLES)

Mọi màn hình và luồng thao tác trong KIDPRO phải tuân thủ nghiêm ngặt 3 nguyên tắc trải nghiệm sau:

### 2.1. Đơn Giản & Dễ Sử Dụng Cho Người Mới (Simplicity & First-Time Usability)
- **Kiểu chữ (Typography):**
  - Sử dụng thống nhất phông chữ **`Plus Jakarta Sans`** hiện đại, bo nét nhẹ nhàng, độ mở ký tự thoáng đãng, tối ưu cho việc đọc trên màn hình di động, máy tính bảng và màn hình Kiosk điểm danh.
  - Tỉ lệ phân cấp font rõ ràng: Tiêu đề trang (`text-2xl font-bold text-slate-800`), Thẻ thông tin (`text-sm font-semibold`), Nội dung phụ tá (`text-xs text-slate-500`).
- **Ngôn ngữ thuần Việt, gần gũi, loại bỏ biệt ngữ kỹ thuật (Plain Language):**
  - ❌ **Không dùng:** *"Payload không hợp lệ"*, *"Syncing to Postgres Core Schema"*, *"UUID mismatch"*, *"Execution 200 OK"*.
  - ✅ **Dùng ngôn ngữ giáo dục:** *"Lưu thông tin thành công"*, *"Chưa chọn phụ huynh đón bé"*, *"Đang gửi thông báo đến ba mẹ"*, *"Không tìm thấy hồ sơ học sinh"*.
- **Thiết kế thân thiện với giáo viên (Teacher-First UI):**
  - Giáo viên thường thao tác trong lớp khi đang chăm sóc nhiều trẻ: Kích thước vùng bấm (Touch Target) tối thiểu **44x44px**.
  - Các thao tác thường nhật (Điểm danh 1 chạm, báo ăn cả lớp, xác nhận đón bé) phải hoàn thành trong **dưới 3 lần nhấp chuột/chạm tay**.

### 2.2. An Toàn & Minh Bạch Thông Tin (Safety & Data Transparency)
- **Tự động bóc tách cảnh báo đỏ cho trẻ dị ứng thực phẩm nặng:**
  - Khi xem danh sách lớp, sổ điểm danh, sổ báo ăn và phân hệ Bếp ăn, hệ thống **bắt buộc tự động gắn tag màu đỏ cảnh báo** cho bất kỳ trẻ nào có tiền sử dị ứng (ví dụ: `⚠️ Dị ứng đậu phộng nặng`, `⚠️ Dị ứng hải sản`, `⚠️ Không uống sữa bò`).
  - Giao diện báo bếp tuyệt đối không được gộp chung khẩu phần của trẻ dị ứng với trẻ bình thường.
- **Quy trình kiểm thực an toàn vệ sinh thực phẩm (ATVSTP) 3 bước:**
  - Màn hình quản lý Bếp ăn phải thể hiện minh bạch 3 bước kiểm thực theo đúng quy định Bộ Y Tế:
    1. *Bước 1: Kiểm thực trước khi nhập nguyên liệu* (độ tươi sống, nguồn gốc hóa đơn).
    2. *Bước 2: Kiểm thực trong quá trình chế biến* (nhiệt độ nấu, quy cách sơ chế).
    3. *Bước 3: Kiểm thực trước khi chia suất & lưu mẫu thức ăn 24h* (ảnh chụp niêm phong hũ lưu mẫu, giờ lưu, người phụ trách).
- **Tuân thủ quyền riêng tư sinh trắc học theo Nghị định 13/2023/NĐ-CP:**
  - Màn hình thu thập ảnh đại diện và dữ liệu nhận diện khuôn mặt của trẻ phải có dòng ghi chú minh bạch về chính sách bảo mật dữ liệu cá nhân trẻ em.
  - Chỉ sử dụng vector đặc trưng khuôn mặt cho mục đích điểm danh nội bộ tại cổng trường, không thương mại hóa, có tùy chọn cho phụ huynh rút lại sự đồng ý bất kỳ lúc nào.

### 2.3. Phản Hồi Thị Giác Thời Gian Thực (Real-Time Visual Feedback)
- **Khung nhận diện AI Camera phản hồi tức thì:**
  - Khi camera tại cổng trường nhận diện khuôn mặt:
    - **Khớp danh tính học sinh / phụ huynh hợp lệ:** Hiển thị khung bounding box màu xanh **Mint Green (`#78C2AD`)**, kèm hiệu ứng tick xanh mượt mà, thông tin bé (Tên bé, Lớp, Phụ huynh đón) hiển thị nổi bật trong vòng 0.3s.
    - **Không khớp danh tính / Người chưa đăng ký:** Khung cảnh báo màu vàng viền cam, yêu cầu nhân viên bảo vệ / giáo vụ kiểm tra đối chiếu trực tiếp.
- **Thông báo đẩy kèm ảnh con đến lớp tức thì (Instant Push Notification):**
  - Ngay khi nhận diện điểm danh vào lớp thành công, hệ thống hiển thị trạng thái phát tin: *"Đã gửi thông báo kèm ảnh con check-in đến ứng dụng của phụ huynh"*.
  - Thẻ thông báo của phụ huynh hiển thị ảnh chụp thời gian thực kèm dấu mộc thời gian (Timestamp) rõ ràng.
- **Phản hồi trạng thái hành động (State Feedback):**
  - Mọi thao tác lưu dữ liệu, xóa, cập nhật phải có Toast thông báo rõ ràng (xanh khi thành công, đỏ khi thất bại kèm hướng dẫn xử lý cụ thể).
  - Trạng thái tải dữ liệu sử dụng hiệu ứng Skeleton Shimmer thay vì vòng quay đơn điệu.

---

## 3. QUY ĐỊNH CẤU TRÚC GIAO DIỆN & COMPONENT CHUẨN

### 3.1. Header & Navigation
- **Navbar / Sidebar:** Sử dụng nền trắng `bg-white` với đường viền tinh tế `border-slate-100` hoặc nền xanh thương hiệu `#275A4E` cho thanh điều hướng trên cùng.
- **Active Navigation Item:** Nền xanh bạc hà nhạt kèm chữ xanh đậm (`bg-emerald-50 text-[#275A4E] font-semibold border-r-4 border-[#275A4E]`).

### 3.2. Nút Bấm & Tương Tác (Buttons & Controls)
```tsx
// 1. Nút Hành Động Chính (Primary Button)
<button className="bg-[#275A4E] hover:bg-[#1E4D40] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition duration-200 flex items-center gap-2">
  <CheckCircle className="w-4 h-4 text-[#78C2AD]" />
  <span>Xác nhận điểm danh</span>
</button>

// 2. Nút Nổi Bật / Vinh Danh (Warm Gold Accent Button)
<button className="bg-[#E5A93C] hover:bg-[#D4982F] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition duration-200 flex items-center gap-2">
  <Sparkles className="w-4 h-4" />
  <span>Gửi thư khen bé</span>
</button>

// 3. Thẻ Cảnh Báo Dị Ứng Bắt Buộc (Allergy Danger Badge)
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-pulse">
  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
  <span>CẢNH BÁO DỊ ỨNG: Đậu phộng / Tôm cua</span>
</div>

// 4. Khung Camera AI Khớp Danh Tính (AI Recognition Frame)
<div className="relative rounded-2xl border-2 border-[#78C2AD] bg-[#78C2AD]/10 p-3 shadow-lg shadow-[#78C2AD]/20">
  <div className="absolute top-2 right-2 bg-[#78C2AD] text-[#1E4D40] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
    <Check className="w-3 h-3" /> Đã xác thực
  </div>
</div>
```

---

## 4. BẢNG CHECKLIST TRƯỚC KHI BÀN GIAO MÃ NGUỒN (MỖI PHIÊN CODE)

Mỗi khi phát triển hoặc cập nhật trang giao diện trong `kidpro-fe`, lập trình viên hoặc AI Agent phải tự kiểm tra 6 tiêu chí:

- [ ] **Màu sắc chuẩn nhận diện:** Đã áp dụng `#275A4E` (Primary), `#1E4D40` (Deep), `#E5A93C` (Accent), `#78C2AD` (Highlight)? Không tự ý dùng màu xanh dương tím không đồng bộ.
- [ ] **Phông chữ:** Đã hiển thị đúng phông chữ `Plus Jakarta Sans`?
- [ ] **Từ ngữ thân thiện:** Đã loại bỏ thuật ngữ IT kỹ thuật số khô cứng khỏi các thông báo người dùng?
- [ ] **Cảnh báo dị ứng nổi bật:** Nếu trang có hiển thị suất ăn/học sinh/báo bếp, đã có nhãn đỏ cảnh báo dị ứng rõ ràng chưa?
- [ ] **Bảo mật sinh trắc học:** Nếu trang có chụp ảnh/nhận diện khuôn mặt, đã có cam kết an toàn dữ liệu trẻ em theo Nghị định 13/2023/NĐ-CP chưa?
- [ ] **Trải nghiệm thời gian thực:** Đã có hiệu ứng khung xanh/toast thông báo tức thì cho người dùng khi hành động hoàn tất chưa?

---

*Tài liệu được bảo tồn và sử dụng làm kim chỉ nam phát triển giao diện xuyên suốt dự án KIDPRO.*
