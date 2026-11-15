# Hướng Dẫn Kỹ Thuật: Camera PWA & Tối Ưu Hóa Trên iOS (WebKit)
> Tài liệu kỹ thuật dự án **KIDPRO** — Điểm danh khuôn mặt mầm non  
> Phiên bản: 1.0 (Tháng 11/2026)

---

## 1. Kiến Trúc Camera Điểm Danh & Quyết Định Thiết Kế

### 1.1 Luồng hoạt động tổng thể (Client-Server Architecture)
```
[Camera Thiết Bị] 
       ↓ (30 FPS raw stream)
[MediaPipe Tasks Vision WASM (Local)] 
       ↓ (Blendshapes: Chớp mắt 80-1800ms + Euler Yaw: Quay đầu ±14°)
[Liveness State Machine (Client)] 
       ↓ (Chụp ảnh gốc unmirrored JPEG ~180KB khi đạt liveness)
[Spring Boot Backend: POST /api/attendance/face-recognition/check-in]
       ↓ (Xác thực challenge + verify hướng quay + đối chiếu vector)
[FastAPI AI Backend (Internal Server-to-Server)]
       ↓
[Spring Boot Quyết Định Cuối Cùng: PRESENT / UNKNOWN / BLURRED]
```

### 1.2 Quyết định kiến trúc & Lý do
1. **MediaPipe Tasks Vision FaceLandmarker chạy cục bộ 100%**:
   - Sử dụng package `@mediapipe/tasks-vision` (phiên bản `^1.2.3`).
   - Tự host toàn bộ file WASM (`vision_wasm_internal.wasm`, `vision_wasm_internal.js`) và model `face_landmarker.task` trong `public/mediapipe/`.
   - **Lý do**: Không phụ thuộc Google CDN tại thời điểm chạy; precache vào Service Worker để mở camera ngay cả khi mạng trường học chập chờn.
2. **Client không quyết định kết quả điểm danh (Zero-Trust Client)**:
   - Client chỉ đo liveness để hỗ trợ trải nghiệm người dùng (hướng dẫn bé chớp mắt/quay đầu, tự động chụp đúng lúc, ngăn chặn ảnh mờ rung).
   - Quyết định điểm danh duy nhất thuộc về Spring Boot Backend (`top1Score >= 0.55`, `margin >= 0.05`, validate and consume challenge token).
3. **Ảnh chụp gửi server là ảnh gốc không lật gương (Unmirrored Frame)**:
   - Khi hiển thị xem trước cho cô giáo/học sinh: áp dụng CSS `transform: scaleX(-1)` để tạo cảm giác tự nhiên như soi gương.
   - Khi chụp ảnh gửi lên server: vẽ trực tiếp từ thẻ `<video>` lên `<canvas>` ẩn mà **không áp bất kỳ transform nào**.
   - **Lý do**: Server phân tích góc quay đầu và thứ tự mắt trái/mắt phải trên hệ trục ảnh gốc tự nhiên. Lật ảnh ở client sẽ làm đảo ngược hoàn toàn hướng quay (Trái thành Phải), dẫn đến server bác bỏ thử thách liveness.

---

## 2. Các Giới Hạn Đã Biết Của iOS WebKit & Cách Xử Lý

| Giới hạn WebKit iOS | Hành vi thực tế trên iPhone | Giải pháp kỹ thuật trong KIDPRO Web/PWA |
|:---|:---|:---|
| **Hỏi lại quyền camera mỗi lần mở** | PWA standalone trên iOS không nhớ vĩnh viễn quyền camera giữa các lần mở lại app. | Không tự động gọi `getUserMedia` khi vừa load trang; hiển thị màn hình giải thích kèm nút bấm **"Bắt đầu điểm danh"** (User Gesture). |
| **Reset quyền khi điều hướng URL** | Trong PWA standalone, đổi URL/hash/pushState khi đang giữ camera có thể ngắt track hoặc kích hoạt lại hộp thoại xin quyền. | Thiết kế màn hình điểm danh là **Single-Page Overlay/Modal**: toàn bộ kết quả, xác nhận, chuyển học sinh đều là state/overlay trong cùng trang; không pushState lịch sử URL. |
| **Dừng track khi app vào nền** | Khi người dùng vuốt về màn hình chính hoặc nhận cuộc gọi, iOS WebKit tự động set track `muted` hoặc `ended`. | Lắng nghe `visibilitychange` & `pagehide`. Khi app vào nền: tạm dừng loop suy luận; khi quay lại: hiển thị nút **"Tiếp Tục Quét"** để chạm khôi phục stream nếu bị ngắt. |
| **Tự động toàn màn hình thẻ video** | Safari tự động đưa `<video>` sang trình phát QuickTime toàn màn hình nếu thiếu cấu hình. | Bắt buộc đặt `playsinline`, `muted`, `autoplay` **trước khi** gán `srcObject = mediaStream`. |
| **Không hỗ trợ ImageCapture API** | `window.ImageCapture` không tồn tại trên iOS Safari. | Tự render frame lên canvas ẩn bằng `canvas.toBlob('image/jpeg', 0.82)` có giới hạn kích thước tối đa 1024px (~180KB). |
| **Không hỗ trợ `navigator.vibrate`** | Rung phản hồi haptic không khả dụng trên web iOS. | Thay thế bằng phản hồi hình ảnh (Face oval đổi màu động theo bước) và âm thanh nhẹ nhàng qua **Web Audio API** (`AudioContext` mở sau user gesture). |
| **iOS Safari tự động phóng to input** | Khi chạm vào ô input có `font-size < 16px`, Safari tự động zoom màn hình làm vỡ bố cục. | Đã cấu hình toàn hệ thống CSS: `input, select, textarea { font-size: 16px !important; }` trên màn hình di động. |
| **Treo GPU Delegate trên một số iOS** | WebGL/Metal delegate đôi khi crash hoặc FPS tụt bất thường trên một số bản WebKit cũ. | Tự động bắt lỗi trong `try/catch`: nếu khởi tạo GPU thất bại hoặc lỗi runtime, State Machine tự động hạ cấp chuyển sang **CPU Delegate**. |

---

## 3. Quy Ước Ánh Xạ Góc Quay Đầu (Euler Yaw Mapping)

Khớp chính xác 100% với file `LivenessDirectionMapper` của app Flutter và `FaceRecognitionController` backend:

- **Bé quay sang TRÁI (theo góc nhìn của bé)**:
  - Giá trị Yaw từ ma trận biến đổi khuôn mặt MediaPipe: **Âm** (`yaw <= -14.0°`, khuyến nghị ngưỡng -15.0°).
  - Hành động server challenge: `TURN_LEFT`.
- **Bé quay sang PHẢI (theo góc nhìn của bé)**:
  - Giá trị Yaw từ ma trận biến đổi khuôn mặt MediaPipe: **Dương** (`yaw >= +14.0°`, khuyến nghị ngưỡng +15.0°).
  - Hành động server challenge: `TURN_RIGHT`.

Unit test tự động cho ánh xạ này đã được thiết lập tại `src/utils/__tests__/liveness.test.ts` (9/9 tests passed).

---

## 4. Checklist Kiểm Thử Thực Tế Trên Máy Thật (Thủ Công)

> Dành cho kỹ sư kiểm tra trên thiết bị iPhone/iPad (iOS 16, 17, 18) và Android Chrome.

| STT | Kịch bản kiểm thử | Thiết bị thử nghiệm | Kỳ vọng đạt được | Kết quả thực tế (Đạt / Không đạt) |
|:---:|:---|:---|:---|:---:|
| 1 | Mở trang `/diag/camera` trên Safari tab | iPhone 11/12/13/14 | Hiển thị đúng User Agent, iOS version, độ phân giải camera, FPS. | *[Cần chạy trên máy thật]* |
| 2 | Benchmark MediaPipe GPU vs CPU | iPhone (iOS Safari) | Khởi tạo < 1500ms; FPS phát hiện thực tế ≥ 15 FPS; Yaw phản hồi nhạy. | *[Cần chạy trên máy thật]* |
| 3 | Cài đặt PWA lên Màn hình chính (Add to Home Screen) | iPhone Safari | Hiện banner hướng dẫn "Chia sẻ -> Thêm vào MH chính"; sau khi cài đặt icon hiển thị đẹp trên Springboard. | *[Cần chạy trên máy thật]* |
| 4 | Mở PWA Standalone từ màn hình chính | iPhone PWA Standalone | Màn hình chạy không có thanh địa chỉ Safari URL bar; `display-mode: standalone` nhận đúng. | *[Cần chạy trên máy thật]* |
| 5 | Chạm "Bật Camera & Bắt Đầu" lần đầu | iPhone PWA Standalone | Hộp thoại xin quyền hiện ra; sau khi bấm Cho phép, luồng video xuất hiện mượt mà. | *[Cần chạy trên máy thật]* |
| 6 | Thao tác Liveness: Mở mắt -> Chớp mắt tự nhiên | iPhone camera trước | Vòng tròn đổi từ vàng sang xanh; phát âm thanh bíp nhẹ; ghi nhận nhịp chớp mắt 80-1800ms. | *[Cần chạy trên máy thật]* |
| 7 | Thao tác Liveness: Quay đầu theo hướng mũi tên | iPhone camera trước | Mũi tên chỉ rõ Trái/Phải; khi quay mặt đạt ±15°, vòng tròn chuyển sang xanh lá và hoàn thành thử thách. | *[Cần chạy trên máy thật]* |
| 8 | Điểm danh liên tiếp 10 - 20 học sinh | iPhone PWA Standalone | **Không bị hỏi lại quyền camera giữa các học sinh**; stream giữ liên tục; bộ nhớ không bị rò rỉ. | *[Cần chạy trên máy thật]* |
| 9 | Vuốt chuyển app ra nền (Background) rồi quay lại | iPhone (Home gesture) | Hiện thông báo "Ứng dụng vừa trở lại"; bấm "Tiếp tục quét" luồng camera phục hồi ngay lập tức không bị đen màn hình. | *[Cần chạy trên máy thật]* |
| 10 | Thử nghiệm trong In-App Browser (Zalo / Facebook) | iPhone (Link Zalo) | Hiển thị cảnh báo vàng khuyến nghị "Mở bằng trình duyệt ngoài Safari". | *[Cần chạy trên máy thật]* |

---

## 5. Hướng Dẫn Sử Dụng Trang Chẩn Đoán `/diag/camera`

1. Đăng nhập hoặc truy cập trực tiếp đường dẫn: `https://<domain-web>/diag/camera`.
2. Bấm nút **"Bật Camera"** (cấp quyền truy cập camera).
3. Bấm **"Thử GPU"** để đo thời gian khởi tạo và FPS suy luận của chip đồ họa.
4. Nhìn vào camera và thử chớp mắt: kiểm tra ô `Blink L/R` có nhảy lên > 50% không.
5. Quay mặt sang trái / sang phải: kiểm tra ô `Yaw` có nhảy sang âm (Trái) / dương (Phải) và hiện huy hiệu `QUAY TRÁI ĐẠT` / `QUAY PHẢI ĐẠT`.
6. Bấm nút **"Sao chép báo cáo JSON"** ở góc trên bên phải để sao chép kết quả vào bộ nhớ tạm và gửi lại cho đội ngũ phát triển.
