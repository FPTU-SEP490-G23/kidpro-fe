# AGENTS.md - Quy Tắc Vận Hành Cho Mọi Phiên Làm Việc (Coding Sessions)

> **Dự án:** KIDPRO Ecosystem (`kidpro-fe`)  
> **Áp dụng cho:** Tất cả các AI Assistants, Subagents và Lập trình viên trong mọi phiên code.

---

## ⚠️ QUY TẮC BẮT BUỘC ĐẦU MỖI PHIÊN LÀM VIỆC (MANDATORY SESSION PROTOCOL)

Trước khi tiến hành phân tích, lập trình, chỉnh sửa hoặc tạo mới bất kỳ mã nguồn giao diện (UI) nào, bạn **BẮT BUỘC** phải đọc và tuân thủ tuyệt đối tài liệu Quy Chuẩn Thiết Kế:
👉 **[DESIGN_SYSTEM.md](file:///d:/1.%20Downloads/kidpro-fe/DESIGN_SYSTEM.md)**

---

## 1. BẢNG MÀU THƯƠNG HIỆU KIDPRO (COLOR PALETTE)
Tuyệt đối không dùng các gam màu lạ lẫm, không đồng bộ (như xanh tím indigo mặc định). Mọi giao diện phải sử dụng hệ màu thương hiệu:
- 🌲 **Primary Forest Green (`#275A4E`):** Màu chủ đạo, thanh điều hướng chính, nút bấm thao tác chính (Primary Button), trạng thái active.
- 🌲 **Deep Brand Green (`#1E4D40`):** Xanh thương hiệu sâu, hover nút chính, footer, banner tiêu đề phân hệ.
- 🌟 **Warm Gold Accent (`#E5A93C`):** Vàng kim ấm áp, huy hiệu khen thưởng, icon sao, nút nổi bật phụ, điểm nhấn vui tươi.
- 🌿 **Mint Green Highlight (`#78C2AD`):** Xanh bạc hà, trạng thái thành công, tag có mặt, viền nhận diện camera AI khớp danh tính.

---

## 2. NGUYÊN TẮC TRẢI NGHIỆM GIÁO DỤC (CORE UX PRINCIPLES)
1. **Đơn giản & Dễ sử dụng cho người mới:**
   - Sử dụng font chữ hiện đại **`Plus Jakarta Sans`**.
   - Giao diện trực quan, nút bấm to rõ (tối thiểu 44x44px).
   - Ngôn ngữ tiếng Việt trong sáng, thân thiện mầm non, **tuyệt đối không hiển thị thuật ngữ kỹ thuật** (UUID, sync worker, status code,...).
2. **An toàn & Minh bạch thông tin:**
   - **Tự động bóc tách cảnh báo đỏ (`#DC2626`)** cho trẻ dị ứng thực phẩm nặng tại mọi màn hình (điểm danh, báo bếp, thực đơn, hồ sơ).
   - Minh bạch quy trình **kiểm thực ATVSTP 3 bước** của Bộ Y Tế.
   - Bảo đảm **quyền riêng tư sinh trắc học theo Nghị định 13/2023/NĐ-CP** khi dùng ảnh/nhận diện khuôn mặt của trẻ.
3. **Phản hồi thị giác thời gian thực:**
   - Khung nhận diện AI Camera báo viền xanh **Mint Green (`#78C2AD`)** ngay khi khớp danh tính.
   - Thông báo đẩy (Push Notification) kèm ảnh con check-in gửi đến phụ huynh tức thì (< 2s).
   - Trạng thái phản hồi tức thì qua Toast và Skeleton loader.

---

## 3. CHECKLIST TRƯỚC KHI KẾT THÚC PHIÊN CODE
- [ ] Giao diện đã tuân thủ đúng bảng màu thương hiệu `#275A4E`, `#1E4D40`, `#E5A93C`, `#78C2AD`?
- [ ] Font chữ đã sử dụng `Plus Jakarta Sans`?
- [ ] Cảnh báo dị ứng hiển thị màu đỏ rõ ràng chưa?
- [ ] Quy định bảo mật dữ liệu trẻ em theo Nghị định 13/2023/NĐ-CP đã được ghi chú minh bạch chưa?
