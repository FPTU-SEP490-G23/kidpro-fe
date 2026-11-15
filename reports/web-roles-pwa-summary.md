# Báo Cáo Nghiệm Thu Kỹ Thuật: Port Role Giáo Viên & Phụ Huynh Lên Web, PWA Shell & Tối Ưu Camera iOS

> Dự án: **KIDPRO** — Cổng Thông Tin & Điểm Danh Khuôn Mặt Mầm Non  
> Kỹ sư thực hiện: Frontend / PWA Senior Engineer  
> Ngày hoàn thành: 15/11/2026  
> Branch git: `feature/pwa-roles-camera`

---

## 1. Tóm Tắt Trạng Thái Từng Hạng Mục

| Hạng mục công việc | Trạng thái | Ghi chú & Kết quả |
|:---|:---:|:---|
| **Phase 0 — Khảo sát & Nguồn sự thật** | **Done** | Khảo sát toàn diện backend Spring Boot, FastAPI AI, app Flutter `kidpro_mobile` và web `kidpro-fe`. Tạo ma trận tương đồng `docs/web-parity-matrix.md`. |
| **Phase 1 — Nền tảng Web & PWA Shell** | **Done** | Cấu hình Vite PWA, Service Worker precache 36.6MB MediaPipe WASM và model, manifest standalone, banner hướng dẫn cài đặt iOS/Android, update prompt. |
| **Phase 2 — Công cụ chẩn đoán `/diag/camera`** | **Done** | Trang `/diag/camera` đo thông số WebKit iOS, FPS thực tế, khởi tạo MediaPipe GPU vs CPU, trích xuất Euler Yaw, kiểm tra chớp mắt/quay đầu và xuất báo cáo JSON. |
| **Phase 3 — Module Camera Điểm Danh** | **Done** | Component `FaceAttendanceCamera` theo chuẩn 12 quy tắc bắt buộc iPhone; State Machine 4 bước; liveness chớp mắt + quay đầu; gửi ảnh gốc unmirrored sang Spring Boot. |
| **Phase 4 — Port Role Giáo Viên & Phụ Huynh** | **Done** | `TeacherShell` với bottom navigation 5 tab + dashboard + điểm danh chuyên cần + tan học + chat + profile; `ParentPage` với mobile bottom navigation + 14 tabs nghiệp vụ. |
| **Phase 5 — Kiểm thử, Đo đạc, Báo cáo** | **Done** | 9/9 Unit test vitest passed 100%; build production thành công không lỗi type-check; checklist kiểm thử máy thật `docs/pwa-camera-ios.md`. |

---

## 2. Số Liệu Đo Đạc & Thống Kê Bundle

### 2.1 Kích thước Bundle & Precache Service Worker
- **Dung lượng Service Worker Precache**: `36,681 KiB` (36.6MB)
  - `public/mediapipe/wasm/vision_wasm_internal.wasm`: ~14.6 MB
  - `public/mediapipe/wasm/vision_wasm_module_internal.wasm`: ~14.6 MB
  - `public/mediapipe/models/face_landmarker.task`: ~3.7 MB
  - App shell JS/CSS/Assets: ~3.7 MB
- **Gzip bundle chính**: `index-*.js`: `846.99 kB` (gzip), `index-*.css`: `18.43 kB` (gzip).

### 2.2 Kết quả Unit Tests (Vitest)
```
 ✓ src/utils/__tests__/liveness.test.ts (9 tests) 6ms
   ✓ 1. Kiểm thử ánh xạ hướng quay đầu: quay trái là yaw âm <= -15°
   ✓ 1. Kiểm thử ánh xạ hướng quay đầu: quay phải là yaw dương >= 15°
   ✓ 1. Trích xuất góc Euler từ ma trận 4x4 MediaPipe
   ✓ 2. Khởi tạo trạng thái ban đầu là IDLE
   ✓ 2. Luồng liveness hoàn chỉnh: Mở mắt -> Nhắm mắt (chớp mắt) -> Quay đầu
   ✓ 2. Từ chối nhắm mắt ngủ gật hoặc nhắm quá lâu (> 1800ms)
   ✓ 2. Xử lý mất khuôn mặt giữa chừng (Face Lost)
   ✓ 2. Chịu được môi trường FPS thấp (frame interval 200ms)
   ✓ 2. Reset sẵn sàng cho học sinh tiếp theo và giải phóng bộ nhớ
 Tests: 9 passed (9)
```

---

## 3. Danh Sách Biến Môi Trường & Cấu Hình Mới

Không cần thêm biến môi trường bắt buộc mới. Ứng dụng tận dụng các biến hiện có:
- `VITE_API_BASE_URL`: URL Backend Spring Boot (mặc định: `http://localhost:8080/api` hoặc qua LAN Wi-Fi).
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: Cấu hình Supabase OAuth (tùy chọn).

---

## 4. Hướng Dẫn Cấu Hình Triển Khai Máy Chủ (Nginx / Cloudflare / Hosting)

Để PWA, WebAssembly và Camera hoạt động trơn tru trên iOS Safari và Android:

### 4.1 Cấu hình Header & MIME Types (`nginx.conf`)
```nginx
# 1. MIME Type bắt buộc cho WebAssembly
types {
    application/wasm wasm;
}

# 2. Không cache service worker và manifest lâu
location ~* (sw\.js|manifest\.webmanifest)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    expires 0;
}

# 3. Cache dài hạn các file WASM và Task model tĩnh đã có hash/cố định
location /mediapipe/ {
    add_header Cache-Control "public, max-age=2592000, immutable";
    gzip_static on;
}

# 4. Quyền Camera và Content Security Policy
add_header Permissions-Policy "camera=(self)";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: http: blob:; worker-src 'self' blob:;";
```

---

## 5. Mục "Yêu Cầu Backend"

Theo đúng quy tắc ranh giới: không tự ý thay đổi logic backend hay tự tạo endpoint mới. Sau khi khảo sát và port chức năng, dưới đây là các ghi nhận kỹ thuật gửi đội ngũ Backend:

1. **Endpoint Web Push Token**:
   - Hiện tại app Flutter khai báo hằng số `/api/notifications/fcm-token`, nhưng backend Spring Boot chưa có controller ánh xạ endpoint này. Web PWA hiện dùng cơ chế in-app notification polling (`/api/notifications`). Nếu cần đẩy Web Push notification khi PWA đóng trên iPhone (iOS 16.4+), đề xuất backend bổ sung endpoint lưu Web Push VAPID Subscription.
2. **CORS Headers cho Domain Web PWA**:
   - Khi PWA được triển khai tại domain/IP riêng (ví dụ `https://pwa.kidpro.edu.vn` hoặc cổng 3000), cấu hình Spring Boot `CorsConfiguration` cần cho phép domain này gọi các endpoint multipart `POST /api/attendance/face-recognition/check-in` và `POST /api/attendance/face-recognition/challenge`.

---

## 6. Những Chỗ Làm Khác Đặc Tả Và Lý Do

1. **Khắc phục lỗi Insecure Trust Model ở endpoint ghi log**:
   - Một số trang web admin cũ trước đây cố gắng gọi trực tiếp `POST /attendance/face-logs`. Backend đã khóa endpoint này (OPT-003) vì lý do bảo mật.
   - Module Camera mới đã chuyển đổi 100% sang endpoint chuẩn: `POST /api/attendance/face-recognition/check-in`, gửi ảnh chính diện + ảnh quay đầu + challenge token để Spring Boot và AI nội bộ tự xác minh.
2. **Áp dụng Single MediaStream cho toàn bộ phiên điểm danh**:
   - Thay vì stop và request lại camera giữa mỗi học sinh, camera giữ nguyên MediaStream trong suốt phiên làm việc của cô giáo để triệt tiêu việc iOS Safari hỏi lại quyền truy cập liên tục.

---

## 7. Phần Chưa Kiểm Chứng & Khuyến Nghị

- **Chưa kiểm chứng**: Hành vi thực tế của chip Neural Engine trên thiết bị iPhone thật đời cũ (như iPhone XR/11) khi chạy MediaPipe GPU Delegate liên tục trong 30 phút. Đề xuất: dùng trang `/diag/camera` trực tiếp trên thiết bị thực tế để đo nhiệt độ và FPS trước khi đưa vào vận hành giờ cao điểm tại cổng trường.
- **Khuyến nghị**: Đối với điểm danh buổi sáng tại cổng trường có lưu lượng đông, tiếp tục khuyến khích cô giáo sử dụng thiết bị iPad / máy tính bảng hoặc giữ app Flutter nếu đường truyền Wi-Fi tại cổng yếu.
