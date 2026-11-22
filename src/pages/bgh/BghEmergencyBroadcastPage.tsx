import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Flame,
  Send,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Radio,
  Users,
  ShieldCheck,
  Building,
  KeyRound
} from 'lucide-react';
import {
  emergencyBroadcastApi,
  EmergencyBroadcastRequestDto,
  EmergencyBroadcastResponseDto
} from '../../api/emergencyBroadcastApi';

const INCIDENT_TYPES = [
  { value: 'WEATHER', label: 'Bão lũ / Thiên tai khắc nghiệt', icon: '🌪️' },
  { value: 'HEALTH', label: 'Dịch bệnh / Vệ sinh an toàn thực phẩm', icon: '🏥' },
  { value: 'SECURITY', label: 'An ninh trật tự / Sự cố an toàn cổng trường', icon: '🛡️' },
  { value: 'UNSCHEDULED_LEAVE', label: 'Nghỉ học đột xuất theo chỉ đạo ngành', icon: '📢' },
  { value: 'OTHER', label: 'Tình huống khẩn cấp khác', icon: '⚠️' },
];

export const BghEmergencyBroadcastPage: React.FC = () => {
  const [latest, setLatest] = useState<EmergencyBroadcastResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Form phát tin khẩn
  const [formData, setFormData] = useState<EmergencyBroadcastRequestDto>({
    title: 'Nghỉ học khẩn cấp phòng chống thiên tai',
    actionPlan: 'Kính gửi toàn thể Quý Phụ huynh và Giáo viên, nhà trường xin thông báo cho học sinh nghỉ học từ sáng mai để đảm bảo an toàn tuyệt đối.',
    incidentType: 'WEATHER',
    scope: 'ALL',
    authCode: '',
  });

  const fetchLatest = async () => {
    try {
      setLoading(true);
      const res: any = await emergencyBroadcastApi.getLatestBroadcast();
      const data = res?.data || res;
      setLatest(data || null);
    } catch (err: any) {
      console.error('Lỗi khi tải tin khẩn gần nhất:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bắt buộc nêu rõ nội dung chỉ đạo hành động
    if (!formData.actionPlan || formData.actionPlan.trim().length < 10) {
      setToastMsg({
        type: 'warning',
        text: 'Bỏ trống hoặc nội dung chỉ đạo hành động quá ngắn. Vui lòng nêu rõ phương án xử lý sự cố an toàn.'
      });
      return;
    }

    if (!window.confirm('CẢNH BÁO: Bạn sắp phát thông báo khẩn cấp tới 100% tài khoản trong toàn trường qua kênh ưu tiên cao nhất. Bạn có chắc chắn muốn phát lệnh?')) {
      return;
    }

    try {
      setBroadcasting(true);
      const res: any = await emergencyBroadcastApi.broadcastEmergency(formData);
      const data: EmergencyBroadcastResponseDto = res?.data || res;

      setLatest(data);
      setToastMsg({
        type: 'success',
        text: 'Lệnh phát thông báo khẩn cấp toàn trường đã được kích hoạt và truyền tải thành công.'
      });

      setFormData(prev => ({ ...prev, authCode: '' }));
    } catch (err: any) {
      console.error('Lỗi phát tin khẩn cấp:', err);
      setToastMsg({
        type: 'error',
        text: err.response?.data?.message || 'Kích hoạt lệnh khẩn cấp thất bại. Vui lòng thử lại.'
      });
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${toastMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : toastMsg.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
        >
          <div className="flex items-center space-x-3">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : toastMsg.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMsg.text}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-xs underline hover:opacity-75 ml-4"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Emergency Alert Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Radio className="w-8 h-8 animate-pulse text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-white/30 backdrop-blur-sm text-white text-xs font-black px-2.5 py-0.5 rounded uppercase">
                  CẤP ĐỘ KHẨN CẤP CAO NHẤT
                </span>
              </div>
              <h1 className="text-2xl font-black mt-1">
                Kích Hoạt Lệnh Phát Tin Nhắn Thông Báo Khẩn Cấp
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Truyền tin thời gian thực tới 100% Phụ huynh & Cán bộ • Bảo vệ an toàn trẻ em
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-300" />
            <span>Giãn cách tối thiểu: 10 phút</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Phát Tin Khẩn Cấp */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              <span>Thiết Lập Bản Tin Khẩn Cấp Toàn Trường</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Tin nhắn sẽ được gửi tức thì qua Push Notification với còi báo động ưu tiên cao nhất
            </p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                1. Phân loại tình huống sự cố khẩn cấp
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {INCIDENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, incidentType: type.value })}
                    className={`p-3 rounded-xl border text-left text-sm font-medium transition flex items-center space-x-3 ${formData.incidentType === type.value
                      ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-500/20'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className="text-xs font-bold leading-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                2. Tiêu đề cảnh báo khẩn cấp
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Ví dụ: Nghỉ học khẩn cấp phòng chống bão lũ..."
                required
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Hệ thống tự động bổ sung tiền tố [KHẨN CẤP] vào đầu thông báo.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                3. Nội dung chỉ đạo hành động bắt buộc <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                value={formData.actionPlan}
                onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
                placeholder="Nêu rõ phương án xử lý, thời gian học sinh nghỉ, hướng dẫn an toàn cho phụ huynh..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Flame className="w-5 h-5" />
              <span>{broadcasting ? 'ĐANG TRUYỀN PHÁT LỆNH KHẨN...' : 'PHÁT THÔNG BÁO KHẨN CẤP TOÀN TRƯỜNG'}</span>
            </button>
          </form>
        </div>

        {/* Thông Tin Lần Phát Gần Nhất */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Thông Báo Khẩn Gần Nhất</span>
              </h3>
              <button
                onClick={fetchLatest}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Làm mới"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {latest ? (
              <div className="space-y-4">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-xs font-bold text-rose-700 uppercase block mb-1">
                    Mã bản tin: {latest.broadcastId}
                  </span>
                  <h4 className="font-black text-rose-950 text-sm leading-snug">
                    {latest.title}
                  </h4>
                  <p className="text-xs text-rose-800 mt-2 whitespace-pre-wrap line-clamp-4">
                    {latest.actionPlan}
                  </p>
                </div>

                <div className="text-xs space-y-2 text-gray-600">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span>Thời gian phát:</span>
                    <strong className="text-gray-900">
                      {new Date(latest.broadcastAt).toLocaleString('vi-VN')}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span>Người kích hoạt:</span>
                    <strong className="text-gray-900">{latest.broadcastBy}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span>Số người tiếp nhận:</span>
                    <strong className="text-emerald-600 font-bold">
                      {latest.totalRecipients} tài khoản (100%)
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Phạm vi:</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-700">
                      Toàn trường
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                Chưa có lịch sử phát thông báo khẩn cấp nào được ghi nhận
              </div>
            )}
          </div>

          {/* Hướng dẫn quy định an toàn */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 text-amber-900 space-y-2 text-xs">
            <h4 className="font-bold flex items-center space-x-1.5 text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Quy Chuẩn Điều Hành An Toàn Mầm Non</span>
            </h4>
            <p className="leading-relaxed">
              Chỉ Ban Giám Hiệu có mã ủy quyền mới được phép kích hoạt phát tin khẩn.
            </p>
            <p className="leading-relaxed">
              Hệ thống tự động khóa phát tin liên tiếp trong vòng 10 phút để tránh tình trạng spam gây nhiễu loạn thông tin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BghEmergencyBroadcastPage;
