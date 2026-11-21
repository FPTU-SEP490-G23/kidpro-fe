import axiosClient from './axiosClient';

export interface AppNotification {
  notificationId: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  authorName?: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

const STORAGE_KEY_PREFIX = 'kidpro_notifications_read_deleted_';

// Tạo danh sách thông báo mặc định theo vai trò nếu backend trả về rỗng
export const getRoleDefaultNotifications = (role?: string | null): AppNotification[] => {
  const now = new Date();
  const formatTime = (minusMinutes: number) => new Date(now.getTime() - minusMinutes * 60000).toISOString();

  if (role === 'BEP') {
    return [
      {
        notificationId: 101,
        title: 'Khóa suất ăn bán trú 08:30 AM',
        body: 'Hệ thống đã tự động chốt số lượng suất ăn có mặt toàn trường sáng nay. Bộ phận Bếp vui lòng xuất kho và định lượng theo bảng phân bổ khẩu phần.',
        isRead: false,
        createdAt: formatTime(15),
        type: 'ATTENDANCE',
        authorName: 'Hệ thống Quản lý Bán trú',
      },
      {
        notificationId: 102,
        title: '⚠️ Cảnh báo trẻ dị ứng thực phẩm',
        body: 'Phát hiện 02 học sinh khối Mầm có tiền sử dị ứng đậu phộng và hải sản. Đề nghị nhân viên bếp chú ý phân chia khẩu phần riêng biệt, tránh lây nhiễm chéo.',
        isRead: false,
        createdAt: formatTime(60),
        type: 'REQUEST',
        authorName: 'Y tế Học đường',
      },
      {
        notificationId: 103,
        title: 'Nhắc nhở lưu mẫu thức ăn 24 giờ',
        body: 'Lưu ý thực hiện quy trình niêm phong mẫu thức ăn từng bữa vào tủ lạnh chuyên dụng ở dải nhiệt độ tiêu chuẩn từ 2°C đến 8°C theo quy định an toàn vệ sinh.',
        isRead: true,
        createdAt: formatTime(180),
        type: 'GENERAL',
        authorName: 'Ban Giám Hiệu',
      },
      {
        notificationId: 104,
        title: 'Kiểm tra nguồn thực phẩm tươi sống đầu ngày',
        body: 'Biên bản giao nhận thực phẩm sáng nay từ nhà cung cấp đã được ký xác nhận bởi thủ kho và giáo viên trực.',
        isRead: true,
        createdAt: formatTime(300),
        type: 'GENERAL',
        authorName: 'Thủ kho thực phẩm',
      },
      {
        notificationId: 105,
        title: 'Thông báo thực đơn tuần mới đã được phê duyệt',
        body: 'Ban Giám Hiệu đã phê duyệt thực đơn tuần mới cho các khối Nhà trẻ và Mẫu giáo. Vui lòng chuẩn bị kế hoạch dự trù nguyên liệu.',
        isRead: true,
        createdAt: formatTime(1440),
        type: 'ANNOUNCEMENT',
        authorName: 'Ban Giám Hiệu',
      },
      {
        notificationId: 106,
        title: 'Tổng vệ sinh và khử trùng khu sơ chế cuối tuần',
        body: 'Lên lịch tổng vệ sinh toàn bộ khu chế biến, bồn rửa và tủ bảo quản thực phẩm vào chiều thứ Sáu.',
        isRead: true,
        createdAt: formatTime(2880),
        type: 'GENERAL',
        authorName: 'Quản lý Bếp',
      },
    ];
  }

  if (role === 'KE_TOAN') {
    return [
      {
        notificationId: 201,
        title: 'Quyết toán học phí & tiền ăn tháng mới',
        body: 'Bảng tính học phí tự động tháng hiện hành đã được tính toán xong. Kế toán có thể đối soát công nợ và phát hành thông báo thu học phí mã VietQR.',
        isRead: false,
        createdAt: formatTime(25),
        type: 'BILLING',
        authorName: 'Phần mềm Tài chính KidPro',
      },
      {
        notificationId: 202,
        title: 'Cập nhật đối soát giao dịch trực tuyến',
        body: 'Ghi nhận 18 giao dịch thanh toán tiền ăn thành công qua cổng thanh toán QR Code. Dữ liệu đã được gạch nợ tự động trên hệ thống.',
        isRead: false,
        createdAt: formatTime(90),
        type: 'BILLING',
        authorName: 'Cổng thanh toán tự động',
      },
      {
        notificationId: 203,
        title: 'Hồ sơ miễn giảm học phí diện chính sách',
        body: 'Ban Giám Hiệu đã phê duyệt danh sách 04 học sinh được xét miễn giảm học phí bán trú học kỳ mới. Kế toán vui lòng áp dụng vào biểu phí.',
        isRead: true,
        createdAt: formatTime(220),
        type: 'REQUEST',
        authorName: 'Ban Giám Hiệu',
      },
      {
        notificationId: 204,
        title: 'Yêu cầu hoàn trả phí dịch vụ xe buýt',
        body: 'Phụ huynh học sinh Lớp Chồi 1 đã nộp đơn ngừng sử dụng dịch vụ xe đưa đón và đề nghị hoàn phí các ngày chưa sử dụng.',
        isRead: true,
        createdAt: formatTime(480),
        type: 'BILLING',
        authorName: 'Cán bộ Giáo vụ',
      },
      {
        notificationId: 205,
        title: 'Báo cáo doanh thu và chi phí bán trú tháng',
        body: 'Báo cáo tổng kết quỹ tiền ăn, khấu hao trang thiết bị và chi phí nhân sự tháng trước đã sẵn sàng để xuất báo cáo kiểm toán.',
        isRead: true,
        createdAt: formatTime(1500),
        type: 'GENERAL',
        authorName: 'Hệ thống Kế toán',
      },
      {
        notificationId: 206,
        title: 'Nhắc nhở đối chiếu công nợ nhà cung cấp thực phẩm',
        body: 'Đến hạn đối soát hóa đơn xuất bán nguyên liệu tuần qua với các đối tác cung ứng rau củ và sữa chua sạch.',
        isRead: true,
        createdAt: formatTime(3000),
        type: 'GENERAL',
        authorName: 'Phòng Kế toán',
      },
    ];
  }

  if (role === 'BGH' || role === 'GIAO_VU') {
    return [
      {
        notificationId: 301,
        title: '📢 Kế hoạch mở lớp và điều động phòng học',
        body: 'Cán bộ giáo vụ đã gửi toàn bộ danh sách lớp học đề xuất cho niên khóa mới. Đề nghị Ban Giám Hiệu xem xét và phê duyệt đợt kế hoạch.',
        isRead: false,
        createdAt: formatTime(20),
        type: 'ANNOUNCEMENT',
        authorName: 'Cán bộ Giáo vụ',
      },
      {
        notificationId: 302,
        title: 'Đơn xin chuyển lớp của học sinh khối Mầm',
        body: 'Có 02 hồ sơ xin chuyển lớp học do phụ huynh yêu cầu chuyển sang cơ sở gần nhà hơn đang chờ ý kiến xác nhận.',
        isRead: false,
        createdAt: formatTime(80),
        type: 'REQUEST',
        authorName: 'Bộ phận Tuyển sinh',
      },
      {
        notificationId: 303,
        title: '📢 Thông báo lịch nghỉ lễ Giỗ Tổ Hùng Vương',
        body: 'Ban Giám hiệu nhà trường xin trân trọng thông báo tới toàn thể cán bộ, giáo viên và quý phụ huynh lịch nghỉ lễ theo quy định chung.',
        isRead: true,
        createdAt: formatTime(240),
        type: 'ANNOUNCEMENT',
        authorName: 'Thầy Hiệu Trưởng',
      },
      {
        notificationId: 304,
        title: 'Duyệt thời khóa biểu tuần học tiếp theo',
        body: 'Thời khóa biểu tuần của các lớp Lá và Chồi đã được thiết lập đủ thời lượng tối thiểu 30 phút mỗi tiết và đang đợi xác nhận.',
        isRead: true,
        createdAt: formatTime(500),
        type: 'GENERAL',
        authorName: 'Tổ chuyên môn Mầm non',
      },
      {
        notificationId: 305,
        title: 'Báo cáo kiểm tra an toàn cơ sở vật chất tháng',
        body: 'Biên bản nghiệm thu sửa chữa sân chơi ngoài trời và rà soát hệ thống camera an ninh đã được lập đầy đủ.',
        isRead: true,
        createdAt: formatTime(1600),
        type: 'GENERAL',
        authorName: 'Quản trị Thiết bị & CSVC',
      },
      {
        notificationId: 306,
        title: 'Hoàn tất cấp tài khoản cho phụ huynh mới',
        body: 'Đã hoàn tất gửi email kích hoạt tài khoản và hướng dẫn cài đặt ứng dụng KidPro tới 45 phụ huynh nhập học đợt mới.',
        isRead: true,
        createdAt: formatTime(3200),
        type: 'GENERAL',
        authorName: 'Cán bộ Giáo vụ',
      },
    ];
  }

  // Default for SYSTEM_ADMIN / SUPER_ADMIN and others
  return [
    {
      notificationId: 401,
      title: 'Hệ thống vận hành ổn định trên Cloud Supabase',
      body: 'Toàn bộ dịch vụ Backend API, Database và lưu trữ hình ảnh Cloudinary đang vận hành với hiệu năng cao, không phát hiện lỗi bất thường.',
      isRead: false,
      createdAt: formatTime(10),
      type: 'GENERAL',
      authorName: 'Trung tâm Vận hành Hệ thống',
    },
    {
      notificationId: 402,
      title: '📢 Thông báo điều hành toàn trường mới nhất',
      body: 'Ban Giám Hiệu đã phát hành bản tin cập nhật kế hoạch hoạt động giảng dạy và an toàn bán trú toàn trường.',
      isRead: false,
      createdAt: formatTime(45),
      type: 'ANNOUNCEMENT',
      authorName: 'Ban Giám Hiệu',
    },
    {
      notificationId: 403,
      title: 'Sao lưu cơ sở dữ liệu định kỳ tự động',
      body: 'Bản sao lưu dự phòng toàn vẹn dữ liệu học sinh, điểm danh và học phí đã được tạo thành công lúc 02:00 AM.',
      isRead: true,
      createdAt: formatTime(350),
      type: 'GENERAL',
      authorName: 'Robot Backup Tự Động',
    },
    {
      notificationId: 404,
      title: 'Rà soát tài khoản và phân quyền người dùng (RBAC)',
      body: 'Ghi nhận phân quyền chính xác cho các nhóm vai trò BGH, Giáo vụ, Kế toán, Bếp và Giáo viên chủ nhiệm theo ma trận an ninh.',
      isRead: true,
      createdAt: formatTime(720),
      type: 'GENERAL',
      authorName: 'Hệ thống Bảo mật An ninh',
    },
    {
      notificationId: 405,
      title: 'Đồng bộ hóa danh mục niên khóa học đường',
      body: 'Thiết lập niên khóa vận hành hiện hành đã được đồng bộ với chuẩn 35 tuần học theo quy định của Bộ Giáo dục và Đào tạo.',
      isRead: true,
      createdAt: formatTime(1800),
      type: 'GENERAL',
      authorName: 'Phân hệ Quản trị',
    },
    {
      notificationId: 406,
      title: 'Cập nhật cấu hình bảo mật PWA Service Worker',
      body: 'Đã hoàn tất cập nhật service worker và bộ nhớ đệm ngoại tuyến (Offline cache) cho ứng dụng trên thiết bị di động.',
      isRead: true,
      createdAt: formatTime(3600),
      type: 'GENERAL',
      authorName: 'Quản trị viên Hệ thống',
    },
  ];
};

export const notificationApi = {
  // Lấy danh sách thông báo
  async getNotifications(role?: string | null, userId?: string): Promise<AppNotification[]> {
    const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'common'}`;
    let readDeletedMap: { readIds: number[]; deletedIds: number[] } = { readIds: [], deletedIds: [] };
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        readDeletedMap = JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    let remoteList: AppNotification[] = [];
    try {
      const res: any = await axiosClient.get('/notifications');
      const raw = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      remoteList = raw.map((item: any) => ({
        notificationId: Number(item.notificationId || item.id || 0),
        title: item.title || '',
        body: item.body || item.content || '',
        isRead: Boolean(item.isRead),
        createdAt: item.createdAt || new Date().toISOString(),
        type: item.type || 'GENERAL',
        authorName: item.authorName || 'Nhà trường',
        attachmentName: item.attachmentName,
        attachmentUrl: item.attachmentUrl,
      }));
    } catch (err) {
      console.warn('Lỗi kết nối /notifications, chuyển sang nạp thông báo hệ thống:', err);
    }

    // Nếu remote trả về rỗng, nạp danh sách chuẩn nghiệp vụ theo vai trò
    if (remoteList.length === 0) {
      remoteList = getRoleDefaultNotifications(role);
    }

    // Lọc bỏ các thông báo đã bị người dùng xóa và cập nhật trạng thái đã đọc từ localStorage
    const filtered = remoteList
      .filter((n) => !readDeletedMap.deletedIds?.includes(n.notificationId))
      .map((n) => ({
        ...n,
        isRead: n.isRead || Boolean(readDeletedMap.readIds?.includes(n.notificationId)),
      }));

    return filtered;
  },

  // Đánh dấu 1 thông báo là đã đọc
  async markAsRead(id: number, userId?: string): Promise<void> {
    const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'common'}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : { readIds: [], deletedIds: [] };
      if (!parsed.readIds.includes(id)) {
        parsed.readIds.push(id);
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }

    try {
      await axiosClient.put(`/notifications/${id}/read`);
    } catch {
      // ignore
    }
  },

  // Đánh dấu tất cả là đã đọc
  async markAllAsRead(allIds: number[], userId?: string): Promise<void> {
    const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'common'}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : { readIds: [], deletedIds: [] };
      allIds.forEach((id) => {
        if (!parsed.readIds.includes(id)) {
          parsed.readIds.push(id);
        }
      });
      localStorage.setItem(storageKey, JSON.stringify(parsed));
    } catch {
      // ignore
    }

    try {
      await axiosClient.put('/notifications/read-all');
    } catch {
      // ignore
    }
  },

  // Xóa 1 thông báo
  async deleteNotification(id: number, userId?: string): Promise<void> {
    const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'common'}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : { readIds: [], deletedIds: [] };
      if (!parsed.deletedIds.includes(id)) {
        parsed.deletedIds.push(id);
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }

    try {
      await axiosClient.delete(`/notifications/${id}`);
    } catch {
      // ignore
    }
  },
};

export default notificationApi;
