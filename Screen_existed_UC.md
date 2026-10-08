# BẢNG ĐỐI CHIẾU MÀN HÌNH FRONTEND & USE CASE ĐẶC TẢ SRS

> **Dự án:** KIDPRO Ecosystem (`kidpro-fe`)  
> **Tài liệu tham chiếu:** SRS & Thiết kế hệ thống KIDPRO  
> **Mục đích:** Thống kê và đối chiếu mức độ tương thích giữa các màn hình / thực thể đã hoàn thành trên Frontend với các Use Case trong tài liệu đặc tả nghiệp vụ SRS.

---

## 1. Bảng đối chiếu các màn hình / thực thể ĐÃ THUỘC Use Case

| STT | Phân hệ / Màn hình | Thực thể quản lý | Use Case tương ứng trong SRS | Đánh giá độ khớp nghiệp vụ |
|:---:|:---|:---|:---|:---|
| 1 | **Học vụ (`AcademicPage`)** | Lớp học (`classes`) | • **UC-010**: Phê duyệt Cấu trúc Lớp học Mới<br>• **UC-016**: Phân công Giáo viên Phụ trách Lớp | Khớp luồng tạo/quản lý cơ cấu lớp học và phân công giáo viên. |
| 2 | **Học vụ (`AcademicPage`)** | Thời khóa biểu (`timetables`) | • **UC-017**: Xếp & Ban hành Thời khóa biểu Tuần<br>• **UC-018**: Kiểm tra Xung đột Lịch dạy & Phòng học | Khớp hoàn toàn nghiệp vụ xếp lịch và kiểm tra trùng lịch. |
| 3 | **Học vụ (`AcademicPage`)** | Đơn chuyển lớp (`transfer_requests`) | • **UC-019**: Xử lý Đơn Chuyển lớp & Bảo lưu | Khớp luồng tiếp nhận, duyệt hoặc từ chối chuyển lớp. |
| 4 | **Học vụ (`AcademicPage`)** | Học sinh (`students`) | • **UC-015**: Tiếp nhận Học sinh & Phân lớp | Khớp nghiệp vụ quản lý hồ sơ và xếp lớp cho trẻ. |
| 5 | **Điểm danh (`AttendancePage`)** | Điểm danh học sinh (`attendances`) | • **UC-021**: Điểm danh Đón trẻ bằng AI Khuôn mặt<br>• **UC-022**: Điểm danh Thủ công Dự phòng | Khớp màn hình chấm điểm danh và xem sổ chuyên cần. |
| 6 | **Báo bếp (`KitchenPage`)** | Món ăn thực đơn tuần (`weekly_menus`) | • **UC-029**: Thiết lập Thực đơn Bán trú Tuần | Khớp chức năng lập thực đơn các bữa (Sáng, Trưa, Xế). |
| 7 | **Báo bếp (`KitchenPage`)** | Báo cáo suất ăn (`daily_summary`) | • **UC-030**: Theo dõi Dashboard Khóa số Suất ăn 08:30 | Khớp luồng chốt và khóa số suất ăn tự động lúc 08:30. |
| 8 | **Tài chính (`FinancePage`)** | Cấu hình khoản thu (`fee_configs`) | • **UC-033**: Cấu hình Danh mục Khoản thu & Tính chất<br>• **UC-011**: Phê duyệt Chính sách Biểu phí Học phí | Khớp luồng thiết lập danh mục các khoản thu phí. |
| 9 | **Tài chính (`FinancePage`)** | Chính sách miễn giảm (`discount_rules`) | • **UC-011**: Phê duyệt Chính sách Biểu phí Học phí<br>• **UC-035**: Chạy Lệnh Sinh Bảng kê Học phí Động (BR-042/BR-056 giảm trừ anh chị em) | Nằm trong phạm vi quy tắc chiết khấu, miễn giảm của biểu phí. |
| 10 | **Tài chính (`FinancePage`)** | Khung phạt đón muộn (`late_pickup_rules`) | • **UC-011**: Phê duyệt Chính sách Biểu phí Học phí<br>• **UC-025**: Ghi nhận Mốc giờ Trẻ Đón muộn | Khớp cấu hình khung tính phụ phí đón trẻ ngoài giờ. |
| 11 | **Tài chính (`FinancePage`)** | Hóa đơn học phí (`invoices`) | • **UC-035**: Chạy Lệnh Sinh Bảng kê Học phí Động<br>• **UC-037**: Duyệt & Phát hành Bảng kê Học phí Hàng loạt<br>• **UC-038**: Gạch nợ Thủ công & Thu Tiền mặt | Khớp luồng tạo nháp, duyệt phát hành và quản lý trạng thái nợ/thu tiền. |
| 12 | **Y tế & Sức khỏe (`HealthPage`)** | Chỉ số BMI thể trạng (`health_metrics`) | • **UC-051**: Ghi nhận Chỉ số Chiều cao & Cân nặng | Khớp theo dõi chiều cao, cân nặng và chỉ số BMI. |
| 13 | **Y tế & Sức khỏe (`HealthPage`)** | Giấc ngủ trưa (`nap_records`) | • Sổ nhật ký theo dõi sinh hoạt & giấc ngủ bán trú | Khớp chức năng ghi nhận giờ ngủ, thức và chất lượng giấc ngủ trưa. |
| 14 | **Y tế & Sức khỏe (`HealthPage`)** | Khẩu phần bữa ăn (`meal_records`) | • Sổ nhật ký dinh dưỡng và khẩu phần ăn từng bữa | Khớp theo dõi mức tiêu thụ suất ăn từng bữa (hết suất/nửa suất/bỏ bữa). |
| 15 | **Y tế & Sức khỏe (`HealthPage`)** | Đánh giá TT 51 (`development_evaluations`) | • Chuẩn đánh giá trẻ theo Thông tư 51/2020/TT-BGDĐT | Khớp chức năng đánh giá sự phát triển của trẻ theo 5 lĩnh vực GD mầm non. |
| 16 | **Y tế & Sức khỏe (`HealthPage`)** | Nhật ký lớp học (`classroom_journals`) | • **UC-028**: Đăng Nhật ký & Hình ảnh Hoạt động Lớp | Khớp bảng tin nhật ký sinh hoạt/hình ảnh của lớp. |
| 17 | **Phụ huynh (`ParentPage`)** | Đơn xin nghỉ học (`leave_requests`) | • **UC-044**: Nộp Đơn xin Nghỉ học Trực tuyến (phía phụ huynh)<br>• **UC-026**: Tiếp nhận & Duyệt Đơn xin Nghỉ học (phía giáo viên) | Khớp nghiệp vụ gửi và theo dõi trạng thái đơn xin nghỉ. |
| 18 | **Phụ huynh (`ParentPage`)** | Xem & Thanh toán hóa đơn con | • **UC-047**: Xem Bảng kê Học phí & Chi tiết Khấu trừ<br>• **UC-048**: Thanh toán Học phí qua VietQR 1-Chạm | Khớp màn hình tra cứu bảng kê và kích hoạt VietQR PayOS. |
| 19 | **Thông báo (`AnnouncementsPage`)** | Thông báo trường (`announcements`) | • **UC-067**: Phát hành Bản tin & Thông báo Toàn trường | Khớp nghiệp vụ soạn thảo, duyệt và phát thông báo. |
| 20 | **Hồ sơ Cá nhân (`ProfilePage`)** | Hồ sơ & Đổi Mật khẩu | • **UC-004**: Cập nhật Thông tin Cá nhân & Đổi Mật khẩu | Khớp quản lý thông tin tài khoản, avatar và đổi mật khẩu an toàn. |
| 21 | **Quản trị Trường (`TenantsPage`)** | Quản lý Multi-Tenant | • **UC-005**: Quản lý Trường học Đa Chi nhánh (Multi-Tenant) | Khớp tạo mới cơ sở trường, mã trường, phân quyền hiệu trưởng và gói thuê bao. |
| 22 | **Phân quyền RBAC (`RbacPage`)** | Ma trận quyền & Tài khoản | • **UC-006**: Quản lý Tài khoản & Ma trận Phân quyền Vai trò | Khớp gán vai trò, quản lý phân quyền chức năng và tài khoản người dùng. |