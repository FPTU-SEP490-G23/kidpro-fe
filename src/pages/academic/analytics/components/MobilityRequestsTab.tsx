import React, { useState } from 'react';
import { StudentMobilityItem } from '../../../../types/studentAnalytics.types';
import { formatDate } from '../../../../utils/formatters';
import { useToast } from '../../../../contexts/ToastContext';
import studentAnalyticsApi from '../../../../api/studentAnalyticsApi';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface MobilityRequestsTabProps {
  requests: StudentMobilityItem[];
  onReviewed: () => void;
}

export const MobilityRequestsTab: React.FC<MobilityRequestsTabProps> = ({
  requests,
  onReviewed,
}) => {
  const { success, error } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await studentAnalyticsApi.reviewTransferRequest(id, {
        status,
        reviewNote:
          status === 'APPROVED'
            ? 'Ban Giám Hiệu đã phê duyệt chuyển lớp theo nguyện vọng phụ huynh.'
            : 'Sĩ số lớp đích đã đạt mức tối đa.',
      });
      success(status === 'APPROVED' ? 'Đã phê duyệt yêu cầu chuyển lớp!' : 'Đã từ chối yêu cầu chuyển lớp.');
      onReviewed();
    } catch {
      error('MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Mã Đơn</th>
              <th className="py-3 px-4">Học Sinh</th>
              <th className="py-3 px-4">Lớp Hiện Tại</th>
              <th className="py-3 px-4">Chuyển Đến / Nguyện Vọng</th>
              <th className="py-3 px-4">Lý Do Đề Xuất</th>
              <th className="py-3 px-4">Ngày Yêu Cầu</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Xét Duyệt (BGH)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <ArrowRightLeft className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">Chưa có yêu cầu chuyển lớp hoặc bảo lưu nào</p>
                </td>
              </tr>
            ) : (
              requests.map((item) => {
                const isPending = item.status === 'PENDING';
                const isApproved = item.status === 'APPROVED';
                const isRejected = item.status === 'REJECTED';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700" title={item.id}>
                      {item.id.includes('-') && item.id.length > 20
                        ? `YC-${item.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
                        : item.id}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">
                      {item.studentName}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {item.fromClassName}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#275A4E]">
                      {item.toClassName}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate" title={item.reason}>
                      {item.reason}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {formatDate(item.requestDate)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : isApproved
                            ? 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
                            : 'bg-rose-50 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isPending ? 'CHỜ DUYỆT' : isApproved ? 'ĐÃ PHÊ DUYỆT' : 'TỪ CHỐI'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReview(item.id, 'APPROVED')}
                            disabled={processingId === item.id}
                            className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-2.5 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Duyệt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReview(item.id, 'REJECTED')}
                            disabled={processingId === item.id}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-bold text-xs transition border border-rose-200 cursor-pointer disabled:opacity-60"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {item.reviewNote || 'Đã xử lý'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MobilityRequestsTab;
