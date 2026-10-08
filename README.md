# KIDPRO Frontend (`kidpro-fe`)

Hệ sinh thái giao diện Web Quản lý Mầm non Toàn diện dành cho **KIDPRO Ecosystem**, kết nối trực tiếp với backend Spring Boot 3.3.4 (`kidpro-be`) và tích hợp hệ thống xác thực người dùng qua **Supabase OAuth / Supabase Auth**.

---

## 1. Công nghệ Sử dụng

- **Core**: React 18, TypeScript, Vite.
- **Xác thực (Authentication)**: **Supabase Auth** (`@supabase/supabase-js`)
  - Hỗ trợ **Google OAuth** (`signInWithOAuth({ provider: 'google' })`).
  - Hỗ trợ Đăng nhập Email / Mật khẩu.
  - Tự động nạp Supabase JWT Bearer token vào Header của mọi request gửi sang Backend qua Axios Interceptors.
  - Công cụ **Dev Quick Switcher**: Cho phép thử nghiệm nhanh quyền hạn của toàn bộ 7 Roles (`SYSTEM_ADMIN`, `BGH`, `GIAO_VU`, `KE_TOAN`, `GIAO_VIEN`, `BEP`, `PHU_HUYNH`).
- **Styling**: Tailwind CSS + PostCSS + Autoprefixer + Lucide React Icons.
- **Routing & Bảo mật**: `react-router-dom` v6 với cơ chế **Role-Based Access Control (RBAC) ProtectedRoute**.

---

## 2. Các Quy tắc Nghiệp vụ Trọng tâm đã Hoàn thiện

1. **Hạn chót Xin nghỉ học (08:00 AM Rule)**:
   - Phụ huynh nộp đơn xin nghỉ trong ngày sau 08:00 AM sẽ bị hệ thống chặn tự động và nhắc nhở gọi điện trực tiếp cho Giáo viên chủ nhiệm để không làm xáo trộn báo ăn.
2. **Khóa chốt Suất ăn Bếp (08:30 AM Cutoff Rule)**:
   - Đúng 08:30 AM hàng ngày, danh sách suất ăn của toàn trường sẽ tự động **ĐÓNG BĂNG (LOCKED)**.
   - Công thức: $\text{Suất ăn cần nấu} = \text{Tổng học sinh} - (\text{Vắng có phép} + \text{Vắng không phép})$.
   - Cảnh báo học sinh dị ứng thực phẩm theo mức độ nguy hiểm (`HIGH`, `MEDIUM`) cho Tổ cấp dưỡng.
3. **Quyết toán Học phí Động (Dynamic Tuition Billing)**:
   - Công thức: $\text{Tổng thanh toán} = \text{Học phí cố định} - (\text{Ngày vắng có phép} \times 50.000\text{đ}) + (\text{Phút đón muộn} \times 1.000\text{đ})$.
   - Tạo mã VietQR tích hợp webhook SePay đối soát tự động.
4. **Theo dõi Thể trạng WHO & Đánh giá TT 51**:
   - Tự động tính chỉ số BMI và phân loại: *Bình thường*, *Suy dinh dưỡng*, *Nguy cơ béo phì*, *Béo phì*.
   - Khung đánh giá phát triển 5 lĩnh vực theo Thông tư 51/2020/TT-BGDĐT.

---

## 3. Cấu trúc Thư mục

```text
kidpro-fe/
├── src/
│   ├── api/                 # Axios client tự động gắn Supabase JWT & các services
│   ├── config/              # Khởi tạo Supabase Client
│   ├── contexts/            # AuthContext (Google OAuth & Role Session)
│   ├── components/
│   │   ├── common/          # StatCard, Button, UI controls
│   │   ├── guard/           # ProtectedRoute (Kiểm tra Role & Session)
│   │   └── layout/          # MainLayout, Sidebar, Navbar
│   ├── pages/
│   │   ├── auth/            # LoginPage (Nút Google OAuth & Role switcher)
│   │   ├── dashboard/       # DashboardPage đa vai trò
│   │   ├── attendance/      # Điểm danh lớp học hàng loạt
│   │   ├── kitchen/         # Báo suất ăn bếp & Cảnh báo dị ứng (08:30 AM)
│   │   ├── finance/         # Kế toán, Biểu phí, Quyết toán học phí VietQR
│   │   ├── health/          # Sức khỏe BMI chuẩn WHO & Nhật ký ảnh lớp
│   │   ├── academic/        # Học vụ, Duyệt chuyển lớp, Thời khóa biểu
│   │   ├── parent/          # Cổng Phụ huynh (Đơn xin nghỉ & Hóa đơn con)
│   │   ├── comms/           # Thông báo trường học
│   │   └── error/           # 403 Forbidden & 404 Not Found
│   ├── types/               # TypeScript interfaces đồng bộ với backend entities
│   ├── utils/               # Format tiền VND, ngày tháng, tính toán WHO BMI
│   ├── App.tsx              # Cây định tuyến Router RBAC
│   ├── main.tsx             # Entrypoint React
│   └── index.css            # Tailwind directives
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 4. Hướng dẫn Khởi chạy Dự án

### Bước 1: Cài đặt Dependencies
Mở terminal tại thư mục `kidpro-fe`:
```bash
npm install
```

### Bước 2: Cấu hình Supabase OAuth (Tùy chọn khi kết nối Production)
Tạo file `.env` tại thư mục gốc `kidpro-fe` với nội dung:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8080/api
```

> **Ghi chú về Google OAuth trên Supabase**:
> 1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard) -> Chọn dự án -> **Authentication** -> **Providers** -> Bật **Google**.
> 2. Điền Google Client ID & Client Secret từ [Google Cloud Console](https://console.cloud.google.com/).
> 3. Cấu hình Redirect URL: `http://localhost:5173`.
> 4. Trong môi trường dev local, bạn có thể sử dụng ngay nút **"Thử nghiệm nhanh theo Vai trò"** trên trang Đăng nhập để test trực tiếp giao diện các Role mà chưa cần key Supabase.

### Bước 3: Khởi chạy Development Server
```bash
npm run dev
```
Truy cập: [http://localhost:5173](http://localhost:5173)
