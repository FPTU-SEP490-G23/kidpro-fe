---
description: Quy chuẩn thiết kế giao diện KIDPRO System (Brand Colors, Typography & Education UX Principles)
globs: ["src/**/*.{ts,tsx,css,html}", "index.html", "tailwind.config.js"]
---

# QUY CHUẨN THIẾT KẾ GIAO DIỆN KIDPRO SYSTEM (DESIGN SYSTEM)

Mỗi khi phân tích, thiết kế hoặc viết mã nguồn giao diện (UI/UX) cho hệ thống KIDPRO, **BẮT BUỘC ĐỌC VÀ TUÂN THỦ** tài liệu quy chuẩn thiết kế tại:
👉 `DESIGN_SYSTEM.md`

## 1. Bảng Màu Thương Hiệu (Color Palette)
- **Primary Forest Green (`#275A4E`)**: Màu chủ đạo, Navbar/Sidebar chính, primary buttons, active states.
- **Deep Brand Green (`#1E4D40`)**: Xanh thương hiệu sâu, hover nút chính, footer, banner tiêu đề phân hệ.
- **Warm Gold Accent (`#E5A93C`)**: Vàng kim ấm áp, huy hiệu vinh danh, ngôi sao đánh giá, nút nổi bật phụ.
- **Mint Green Highlight (`#78C2AD`)**: Xanh bạc hà, trạng thái thành công, tag có mặt, viền nhận diện camera AI khớp danh tính.

## 2. Nguyên Tắc Trải Nghiệm Giáo Dục (UX Principles)
1. **Đơn giản & Dễ sử dụng cho người mới:**
   - Font chữ chuẩn: **Plus Jakarta Sans**.
   - Hạn chế tối đa thuật ngữ kỹ thuật phức tạp đối với người dùng (thay thế bằng từ ngữ sư phạm gần gũi).
   - Vùng cảm ứng tối thiểu 44x44px, hỗ trợ thao tác nhanh cho giáo viên.
2. **An toàn & Minh bạch thông tin:**
   - Tự động bóc tách cảnh báo đỏ (`#DC2626`) cho học sinh dị ứng thực phẩm nặng tại mọi màn hình (báo bếp, điểm danh, thực đơn, hồ sơ).
   - Quy trình kiểm thực ATVSTP 3 bước theo chuẩn Bộ Y Tế.
   - Tuân thủ quyền riêng tư dữ liệu sinh trắc học theo Nghị định 13/2023/NĐ-CP (ghi chú minh bạch, mã hóa vector khuôn mặt).
3. **Phản hồi thị giác thời gian thực:**
   - Khung nhận diện AI Camera viền xanh Mint Green (`#78C2AD`) khi khớp danh tính.
   - Thông báo đẩy tức thì kèm ảnh con đến lớp gửi đến phụ huynh (< 2 giây).
