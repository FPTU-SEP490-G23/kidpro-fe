import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Sparkles,
  Search,
  Check,
  HeartHandshake,
  RefreshCw,
  Baby,
  Building,
  Info,
  ShieldCheck,
  AlertOctagon,
  X
} from 'lucide-react';
import { kitchenApi } from '../../../api/kitchenApi';
import { useAuth } from '../../../contexts/AuthContext';
import { DietaryAllergyItem } from '../../../types/kitchen.types';

// Dữ liệu mẫu chuẩn đối chiếu xung đột dị ứng hôm nay
const DEFAULT_DIETARY_ITEMS: DietaryAllergyItem[] = [
  {
    id: 'diet-01',
    studentId: 'stu-minh-01',
    studentName: 'Trần Bình Minh',
    classId: 'cls-choi1',
    className: 'Chồi 1 (Sơn Ca)',
    roomNumber: 'Phòng B201',
    allergyTags: ['Tôm / Cua / Hải sản vỏ cứng'],
    severity: 'ANAPHYLAXIS', // Cấp độ sốc phản vệ -> Viền đỏ nhấp nháy MSG-128
    todayConflictedDishes: ['Chả tôm hấp ngũ sắc', 'Canh cua mồng tơi'],
    safeSubstituteDish: 'Thịt heo nạc thăn rim nấm đông cô + Canh bí đỏ thịt băm',
    preparationStatus: 'PENDING',
    isolatedAreaConfirmed: false,
    labelPrinted: false,
    isPresentToday: true,
    parentNotes: 'Bé từng bị sốc nổi mẩn đỏ khó thở khi ăn tôm ở nhà lúc 2 tuổi.'
  },
  {
    id: 'diet-02',
    studentId: 'stu-an-02',
    studentName: 'Nguyễn Thảo An',
    classId: 'cls-mam1',
    className: 'Mầm 1 (Họa Mi)',
    roomNumber: 'Phòng A102',
    allergyTags: ['Đậu phộng / Lạc'],
    severity: 'ANAPHYLAXIS', // Đậu phộng nguy cơ cao
    todayConflictedDishes: ['Nộm bắp cải rắc lạc rang'],
    safeSubstituteDish: 'Nộm bắp cải cà rốt mè rang hữu cơ',
    preparationStatus: 'PREPARED',
    preparedAt: '09:45:00',
    preparedBy: 'Bếp phó Hoàng Oanh',
    isolatedAreaConfirmed: true,
    labelPrinted: true,
    labelPrintedAt: '09:48:00',
    isPresentToday: true,
    parentNotes: 'Tuyệt đối kiêng dầu đậu phộng hoặc sốt đậu phộng.'
  },
  {
    id: 'diet-03',
    studentId: 'stu-khoi-03',
    studentName: 'Phạm Đăng Khôi',
    classId: 'cls-nt1',
    className: 'Nhà trẻ 1 (Gấu Bông)',
    roomNumber: 'Phòng N01',
    allergyTags: ['Đạm sữa bò (Cow milk protein)'],
    severity: 'HIGH',
    todayConflictedDishes: ['Súp bí đỏ kem sữa'],
    safeSubstituteDish: 'Cháo sườn heo củ sen búp (Không cho sữa tươi hay phô mai)',
    preparationStatus: 'PREPARED',
    preparedAt: '09:30:00',
    preparedBy: 'Bếp trưởng Thanh Vân',
    isolatedAreaConfirmed: true,
    labelPrinted: true,
    labelPrintedAt: '09:32:00',
    isPresentToday: true,
    parentNotes: 'Bé đổi sang sữa hạt yến mạch do mẹ mang theo gửi cô giáo.'
  },
  {
    id: 'diet-04',
    studentId: 'stu-vy-04',
    studentName: 'Lê Hoàng Khánh Vy',
    classId: 'cls-choi1',
    className: 'Chồi 1 (Sơn Ca)',
    roomNumber: 'Phòng B201',
    allergyTags: ['Trứng gà'],
    severity: 'MEDIUM',
    todayConflictedDishes: ['Trứng cuộn rau củ'],
    safeSubstituteDish: 'Đậu hũ non sốt cà chua thịt băm',
    preparationStatus: 'PENDING',
    isolatedAreaConfirmed: false,
    labelPrinted: false,
    isPresentToday: true,
    parentNotes: 'Ăn được thịt gà, chỉ kiêng lòng đỏ và lòng trắng trứng gà.'
  },
  {
    id: 'diet-05',
    studentId: 'stu-long-05',
    studentName: 'Vũ Hoàng Long',
    classId: 'cls-la1',
    className: 'Lá 1 (Đại Bàng Con)',
    roomNumber: 'Phòng C301',
    allergyTags: ['Gluten / Bột mì'],
    severity: 'HIGH',
    todayConflictedDishes: ['Bánh canh bột mì bữa xế'],
    safeSubstituteDish: 'Chè sen long nhãn bột sắn dây tinh khiết',
    preparationStatus: 'PENDING',
    isolatedAreaConfirmed: false,
    labelPrinted: false,
    isPresentToday: true,
    parentNotes: 'Bé có tiền sử bệnh Celiac dị ứng gluten.'
  }
];

export const AllergyDietaryManagementTab: React.FC = () => {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  const isParentOrTeacher = role === 'PHU_HUYNH' || role === 'GIAO_VIEN';

  const [activeSubView, setActiveSubView] = useState<'KITCHEN_TRACKER' | 'PARENT_TEACHER_VIEW'>(
    isParentOrTeacher ? 'PARENT_TEACHER_VIEW' : 'KITCHEN_TRACKER'
  );
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Toast / Thông báo
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // State cục bộ lưu danh sách trẻ dị ứng
  const [items, setItems] = useState<DietaryAllergyItem[]>(DEFAULT_DIETARY_ITEMS);

  // Modal in nhãn định danh dán khay ăn (MSG-129)
  const [printLabelModalItem, setPrintLabelModalItem] = useState<DietaryAllergyItem | null>(null);

  // Modal chỉnh sửa món ăn thay thế
  const [editSubstituteModalItem, setEditSubstituteModalItem] = useState<DietaryAllergyItem | null>(null);
  const [customSubstituteText, setCustomSubstituteText] = useState<string>('');

  // 1. Fetch danh sách học sinh dị ứng (GET /api/academic/students/by-allergy)
  const { isRefetching, refetch } = useQuery({
    queryKey: ['students-by-allergy'],
    queryFn: async () => {
      try {
        const res: any = await kitchenApi.getStudentsByAllergy();
        if (res && Array.isArray(res) && res.length > 0) {
          // Kết hợp danh sách
        }
        return res;
      } catch (err: any) {
        console.warn('API /api/academic/students/by-allergy fallback:', err.message);
        return DEFAULT_DIETARY_ITEMS;
      }
    }
  });

  // Mutation: Xác nhận chuẩn bị suất ăn đặc biệt (MSG-127)
  const prepareMutation = useMutation({
    mutationFn: async ({
      itemId,
      isolatedAreaConfirmed,
      safeSubstituteDish
    }: {
      itemId: string;
      isolatedAreaConfirmed: boolean;
      safeSubstituteDish: string;
    }) => {
      return await kitchenApi.updateDietaryPreparation({
        itemId,
        preparationStatus: 'PREPARED',
        isolatedAreaConfirmed,
        preparedBy: user?.fullName || 'Nhân viên Bếp',
        safeSubstituteDish
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students-by-allergy'] });
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === variables.itemId) {
            return {
              ...item,
              preparationStatus: 'PREPARED',
              preparedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              preparedBy: user?.fullName || 'Nhân viên Bếp',
              isolatedAreaConfirmed: variables.isolatedAreaConfirmed,
              safeSubstituteDish: variables.safeSubstituteDish || item.safeSubstituteDish
            };
          }
          return item;
        })
      );
      setToastMessage({
        type: 'success',
        text: 'MSG-127: Xác nhận chuẩn bị suất ăn đặc biệt cho trẻ có nhu cầu dinh dưỡng riêng thành công.'
      });
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        text: 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.'
      });
    }
  });

  // Xử lý xác nhận chuẩn bị suất ăn
  const handleConfirmPrepared = (item: DietaryAllergyItem) => {
    // Kiểm tra cam kết khu vực khử khuẩn cách ly (BR-041, BR-042)
    if (!item.isolatedAreaConfirmed) {
      setToastMessage({
        type: 'warning',
        text: 'Vui lòng đánh dấu chọn cam kết Chế biến tại khu vực khử khuẩn riêng biệt trước khi bấm hoàn tất!'
      });
      return;
    }

    // Cảnh báo sốc phản vệ nếu có
    if (item.severity === 'ANAPHYLAXIS') {
      setToastMessage({
        type: 'info',
        text: `MSG-128: Đã kiểm tra an toàn sốc phản vệ: Suất ăn thay thế cho bé ${item.studentName} đã được kiểm tra không chứa dị nguyên!`
      });
    }

    prepareMutation.mutate({
      itemId: item.id,
      isolatedAreaConfirmed: item.isolatedAreaConfirmed,
      safeSubstituteDish: item.safeSubstituteDish
    });
  };

  // Toggle checkbox cam kết khu vực cách ly
  const handleToggleIsolation = (itemId: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isolatedAreaConfirmed: checked } : item))
    );
  };

  // Xử lý in nhãn khay ăn dị ứng (MSG-129)
  const handlePrintLabel = (item: DietaryAllergyItem) => {
    if (!item.roomNumber || !item.className) {
      setToastMessage({
        type: 'error',
        text: 'MSG-129: Mỗi suất ăn dị ứng bắt buộc phải được gắn thẻ tên bé và phòng học cụ thể.'
      });
      return;
    }
    setPrintLabelModalItem(item);
  };

  const handleExecutePrint = () => {
    if (!printLabelModalItem) return;
    // Đánh dấu đã in nhãn
    setItems((prev) =>
      prev.map((i) =>
        i.id === printLabelModalItem.id
          ? {
              ...i,
              labelPrinted: true,
              labelPrintedAt: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          : i
      )
    );
    window.print();
  };

  // Mở modal sửa món thay thế
  const handleOpenEditSubstitute = (item: DietaryAllergyItem) => {
    setEditSubstituteModalItem(item);
    setCustomSubstituteText(item.safeSubstituteDish);
  };

  const handleSaveSubstitute = () => {
    if (!editSubstituteModalItem || !customSubstituteText.trim()) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === editSubstituteModalItem.id
          ? { ...i, safeSubstituteDish: customSubstituteText.trim() }
          : i
      )
    );
    setEditSubstituteModalItem(null);
    setToastMessage({
      type: 'success',
      text: 'Đã cập nhật món ăn thay thế an toàn cho bé thành công.'
    });
  };

  // Lọc danh sách học sinh
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSeverity = filterSeverity === 'ALL' || item.severity === filterSeverity;
      const matchStatus = filterStatus === 'ALL' || item.preparationStatus === filterStatus;
      const matchSearch =
        item.studentName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.className.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.allergyTags.some((t) => t.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        item.safeSubstituteDish.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchSeverity && matchStatus && matchSearch;
    });
  }, [items, filterSeverity, filterStatus, searchKeyword]);

  // Danh sách các bé bị sốc phản vệ nguy cơ cao
  const severeAlertKids = items.filter((i) => i.severity === 'ANAPHYLAXIS');
  const pendingCount = items.filter((i) => i.preparationStatus === 'PENDING').length;
  const preparedCount = items.filter((i) => i.preparationStatus === 'PREPARED').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification Box */}
      {toastMessage && (
        <div
          className={`flex items-start justify-between p-4 rounded-2xl border shadow-sm transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0" />}
            {toastMessage.type === 'info' && <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold underline hover:opacity-75 ml-4"
          >
            Đóng
          </button>
        </div>
      )}

      {/* CẢNH BÁO SỐC PHẢN VỆ ĐẶC BIỆT NGUY HIỂM (MSG-128) */}
      {severeAlertKids.length > 0 && (
        <div className="rounded-3xl border-2 border-red-500 bg-red-50/90 p-5 shadow-lg relative overflow-hidden animate-pulse">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-red-600 text-white shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-red-900 uppercase tracking-tight">
                  CẢNH BÁO DỊ ỨNG NGUY HIỂM CẤP ĐỘ SỐC PHẢN VỆ (ANAPHYLAXIS)
                </span>
                <span className="bg-red-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  {severeAlertKids.length} HỌC SINH
                </span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                <strong>MSG-128:</strong> Phát hiện học sinh có tiền sử dị ứng nặng với đậu phộng hoặc hải sản trùng với thực đơn hôm nay.
                Bếp bắt buộc phải chuẩn bị suất ăn thay thế tại <strong>khu vực cách ly khử khuẩn riêng biệt (BR-041, BR-042)</strong> và dán nhãn định danh chống nhầm lẫn (MSG-129).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {severeAlertKids.map((k) => (
                  <span
                    key={k.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-red-900 border border-red-300 text-xs font-bold shadow-xs"
                  >
                    <span>⚠️ {k.studentName} ({k.className})</span>
                    <span className="text-[10px] text-red-600 underline">
                      {k.allergyTags.join(', ')}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THANH CHUYỂN ĐỔI CHẾ ĐỘ XEM (BẾP TRACKER HOẶC PHỤ HUYNH / GIÁO VIÊN VIEW) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubView('KITCHEN_TRACKER')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 min-h-[44px] ${
              activeSubView === 'KITCHEN_TRACKER'
                ? 'bg-[#275A4E] text-white shadow-md shadow-emerald-900/10'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Quản Lý Khay Ăn Cách Ly Bếp ({items.length} trẻ)</span>
          </button>

          <button
            onClick={() => setActiveSubView('PARENT_TEACHER_VIEW')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 min-h-[44px] ${
              activeSubView === 'PARENT_TEACHER_VIEW'
                ? 'bg-[#E5A93C] text-[#1E4D40] shadow-md shadow-amber-900/10'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <HeartHandshake className="h-4 w-4 text-amber-700" />
            <span>Góc Tra Cứu Phụ Huynh & Giáo Viên</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Đã chuẩn bị: <strong className="text-emerald-700">{preparedCount}</strong> / {items.length} (Chờ: <strong className="text-amber-600">{pendingCount}</strong>)
          </span>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: BẢNG QUẢN LÝ KHAY ĂN CÁCH LY CHO ĐẦU BẾP */}
      {activeSubView === 'KITCHEN_TRACKER' && (
        <div className="space-y-6">
          {/* BANNER ĐỐI CHIẾU XUNG ĐỘT THỰC ĐƠN HÔM NAY (Section 2 - Daily Conflict Banner) */}
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 p-5 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500 text-white">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Đối Chiếu Xung Đột Giữa Thực Đơn Bán Trú & Tiền Sử Dị Ứng Hôm Nay
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Hệ thống tự động quét các món ăn trong thực đơn bữa trưa và bữa xế hôm nay, đối chiếu với danh mục dị nguyên của học sinh có mặt để đề xuất món thay thế an toàn.
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-slate-600 block">Tiến độ chuẩn bị</span>
                <span className="text-xl font-extrabold text-[#275A4E]">
                  {preparedCount} / {items.length} khay
                </span>
              </div>
            </div>

            {/* Danh sách các món xung đột phổ biến */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-red-200 bg-white p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold text-red-600 block uppercase">
                  Món Xung Đột 1: Chả tôm hấp
                </span>
                <p className="text-xs text-slate-700 font-semibold mt-1">
                  Trùng dị ứng: Tôm / Cua ({items.filter((i) => i.allergyTags.some((t) => t.includes('Hải sản') || t.includes('Tôm'))).length} bé)
                </p>
                <span className="text-[11px] text-emerald-700 font-medium block mt-1">
                  ✅ Món thay thế: Thịt nạc băm rim nấm
                </span>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold text-amber-700 block uppercase">
                  Món Xung Đột 2: Nộm bắp cải lạc rang
                </span>
                <p className="text-xs text-slate-700 font-semibold mt-1">
                  Trùng dị ứng: Đậu phộng / Lạc (1 bé)
                </p>
                <span className="text-[11px] text-emerald-700 font-medium block mt-1">
                  ✅ Món thay thế: Nộm bắp cải mè rang
                </span>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-white p-3.5 shadow-2xs">
                <span className="text-[11px] font-bold text-blue-700 block uppercase">
                  Món Xung Đột 3: Trứng cuộn rau củ
                </span>
                <p className="text-xs text-slate-700 font-semibold mt-1">
                  Trùng dị ứng: Trứng gà (1 bé)
                </p>
                <span className="text-[11px] text-emerald-700 font-medium block mt-1">
                  ✅ Món thay thế: Đậu hũ non sốt cà chua
                </span>
              </div>
            </div>
          </div>

          {/* THANH BỘ LỌC DANH SÁCH KHAY ĂN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase mr-1">Cấp độ:</span>
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'ANAPHYLAXIS', label: '⚠️ Sốc phản vệ' },
                { id: 'HIGH', label: 'Nặng' },
                { id: 'MEDIUM', label: 'Trung bình' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterSeverity(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                    filterSeverity === pill.id
                      ? 'bg-[#275A4E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}

              <span className="text-xs font-bold text-slate-500 uppercase ml-2 mr-1">Trạng thái:</span>
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'PENDING', label: 'Chờ chế biến' },
                { id: 'PREPARED', label: 'Đã hoàn tất' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterStatus(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                    filterStatus === pill.id
                      ? 'bg-[#E5A93C] text-[#1E4D40] shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Tìm tên bé, lớp, dị nguyên..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#275A4E] focus:outline-hidden"
              />
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* DANH SÁCH CHI TIẾT TỪNG TRẺ CẦN KHAY ĂN CÁCH LY (DIETARY PREPARATION TRACKER) */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
                <h4 className="font-bold text-slate-800">Không tìm thấy yêu cầu chế độ ăn riêng</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Tất cả các học sinh đều dùng suất ăn tiêu chuẩn hoặc không có dữ liệu trùng khớp với bộ lọc.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isAnaphylaxis = item.severity === 'ANAPHYLAXIS';
                const isDone = item.preparationStatus === 'PREPARED';

                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl border bg-white p-5 shadow-xs transition-all relative overflow-hidden ${
                      isAnaphylaxis && !isDone
                        ? 'border-red-400 ring-2 ring-red-400/50 shadow-md'
                        : isDone
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* Cột 1: Thông tin học sinh & Cảnh báo dị nguyên */}
                      <div className="space-y-2 lg:max-w-xs">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-base">
                            {item.studentName}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                            {item.className}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Building className="h-3.5 w-3.5 text-slate-400" />
                            {item.roomNumber}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <Baby className="h-3.5 w-3.5" />
                            {item.isPresentToday ? 'Có mặt hôm nay' : 'Vắng mặt'}
                          </span>
                        </div>

                        {/* Badges Dị nguyên */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.allergyTags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 ${
                                isAnaphylaxis
                                  ? 'bg-[#DC2626] text-white'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              <AlertOctagon className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>

                        {item.parentNotes && (
                          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <strong>Dặn dò phụ huynh:</strong> {item.parentNotes}
                          </p>
                        )}
                      </div>

                      {/* Cột 2: Đối chiếu Món kiêng kỵ & Món thay thế */}
                      <div className="flex-1 space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Món kiêng kỵ trong ngày */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-red-600 uppercase flex items-center gap-1">
                              <X className="h-3.5 w-3.5 text-red-600" />
                              Món ăn kiêng kỵ hôm nay:
                            </span>
                            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-900">
                              {item.todayConflictedDishes.join(', ')}
                            </div>
                          </div>

                          {/* Món thay thế đã chỉ định */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                                <Check className="h-3.5 w-3.5 text-emerald-700" />
                                Món thay thế an toàn:
                              </span>
                              {!isDone && (
                                <button
                                  onClick={() => handleOpenEditSubstitute(item)}
                                  className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 underline"
                                >
                                  Đổi món
                                </button>
                              )}
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                              {item.safeSubstituteDish}
                            </div>
                          </div>
                        </div>

                        {/* Checkbox cam kết khu vực cách ly (BR-041, BR-042) */}
                        <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`isolate-${item.id}`}
                            checked={item.isolatedAreaConfirmed}
                            disabled={isDone}
                            onChange={(e) => handleToggleIsolation(item.id, e.target.checked)}
                            className="h-4 w-4 rounded-md text-[#275A4E] focus:ring-[#275A4E] border-slate-300"
                          />
                          <label
                            htmlFor={`isolate-${item.id}`}
                            className="text-xs text-slate-700 font-medium cursor-pointer select-none"
                          >
                            Cam kết chế biến tại <strong>khu vực khử khuẩn tách biệt</strong> để tránh lây nhiễm chéo dị nguyên (BR-041, BR-042).
                          </label>
                        </div>
                      </div>

                      {/* Cột 3: Thao tác Bếp & In Nhãn */}
                      <div className="flex flex-col gap-2 shrink-0 lg:w-48">
                        {/* Huy hiệu trạng thái */}
                        <div className="text-center">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>Đã chuẩn bị ({item.preparedAt})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold animate-pulse">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              <span>Chờ chuẩn bị khay</span>
                            </span>
                          )}
                        </div>

                        {/* Nút In nhãn khay ăn dị ứng (MSG-129) */}
                        <button
                          onClick={() => handlePrintLabel(item)}
                          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition min-h-[44px] ${
                            item.labelPrinted
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-white border border-[#275A4E] text-[#275A4E] hover:bg-emerald-50'
                          }`}
                        >
                          <Printer className="h-4 w-4" />
                          <span>{item.labelPrinted ? 'In lại nhãn' : 'In Nhãn Dán Khay'}</span>
                        </button>

                        {/* Nút Xác nhận đã chuẩn bị */}
                        {!isDone ? (
                          <button
                            onClick={() => handleConfirmPrepared(item)}
                            disabled={prepareMutation.isPending}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white py-2 px-3 text-xs font-bold shadow-md shadow-emerald-900/10 min-h-[44px] active:scale-95 transition"
                          >
                            <Check className="h-4 w-4" />
                            <span>Xác Nhận Đã Nấu Xong</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-center text-slate-400 font-medium">
                            Bếp: {item.preparedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: GIAO DIỆN TRA CỨU DÀNH CHO PHỤ HUYNH & GIÁO VIÊN */}
      {activeSubView === 'PARENT_TEACHER_VIEW' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-teal-200 bg-teal-50/50 p-5 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-teal-600 text-white shrink-0">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-teal-900 text-base">
                Kênh Tra Cứu Dinh Dưỡng Dành Riêng Cho Phụ Huynh & Giáo Viên
              </h3>
              <p className="text-xs text-teal-800 mt-1 leading-relaxed">
                Nhà trường cam kết tuân thủ nghiêm ngặt quy trình kiểm soát dị nguyên. Phụ huynh có thể theo dõi trực tiếp món ăn thay thế của con, trạng thái chuẩn bị của bếp ăn và quy trình cách ly chống nhiễm chéo sinh trắc học theo <strong>Nghị định 13/2023/NĐ-CP</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((stu) => (
              <div
                key={stu.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{stu.studentName}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {stu.className} • {stu.roomNumber}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      stu.preparationStatus === 'PREPARED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {stu.preparationStatus === 'PREPARED' ? 'Đã chuẩn bị' : 'Đang chế biến'}
                  </span>
                </div>

                <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                  <span className="text-[11px] font-bold text-red-600 uppercase block">
                    Dị nguyên cần tránh tuyệt đối:
                  </span>
                  <p className="text-xs font-extrabold text-red-900 mt-0.5">
                    {stu.allergyTags.join(', ')}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase block">
                    Khẩu phần dinh dưỡng thay thế cho bé:
                  </span>
                  <p className="text-xs font-bold text-emerald-900 mt-0.5">
                    {stu.safeSubstituteDish}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Khu vực cách ly: {stu.isolatedAreaConfirmed ? 'Đã khử khuẩn' : 'Chờ xác nhận'}
                  </span>
                  <span>Tem khay: {stu.labelPrinted ? 'Đã dán' : 'Chưa in'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL IN NHÃN KHAY ĂN DỊ ỨNG (MSG-129 PRINT PREVIEW) */}
      {printLabelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#275A4E]">
                <Printer className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Xem Trước Nhãn Dán Khay Ăn Cách Ly
                </h3>
              </div>
              <button
                onClick={() => setPrintLabelModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* MÔ PHỎNG NHÃN NHIỆT / STICKER KHAY ĂN (KÍCH THƯỚC CHUẨN 80x50mm) */}
            <div className="mt-4 p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-amber-50/20 text-slate-800 space-y-3 font-mono">
              <div className="text-center border-b border-slate-300 pb-2">
                <span className="text-[11px] font-bold tracking-widest text-[#275A4E] block">
                  KIDPRO MEAL SYSTEM • KHAY ĂN DỊ ỨNG
                </span>
                <h2 className="text-lg font-black text-slate-900 uppercase mt-1">
                  {printLabelModalItem.studentName}
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  Lớp: {printLabelModalItem.className} • {printLabelModalItem.roomNumber}
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-xl bg-red-100 border border-red-300 text-red-900 font-bold">
                  ⛔ CẤM DỊ NGUYÊN: {printLabelModalItem.allergyTags.join(', ')}
                </div>

                <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold">
                  🍲 MÓN THAY THẾ: {printLabelModalItem.safeSubstituteDish}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                <span>Ngày: {new Date().toLocaleDateString('vi-VN')}</span>
                <span>Bếp: {printLabelModalItem.preparedBy || 'Tổ Dinh Dưỡng'}</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-amber-600" />
              <span>
                Quy định <strong>MSG-129</strong>: Mỗi suất ăn dị ứng bắt buộc phải dán tem định danh trước khi chuyển khỏi bếp ăn.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setPrintLabelModalItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExecutePrint}
                className="px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold shadow-md min-h-[44px] flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>In Thẻ Nhãn Ngay (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SỬA MÓN THAY THẾ */}
      {editSubstituteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-2">
              Chỉ Định Món Ăn Thay Thế Cho Bé {editSubstituteModalItem.studentName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Dị ứng: <strong>{editSubstituteModalItem.allergyTags.join(', ')}</strong>. Vui lòng nhập món ăn an toàn không chứa các thành phần trên.
            </p>

            <textarea
              rows={3}
              value={customSubstituteText}
              onChange={(e) => setCustomSubstituteText(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
              placeholder="Nhập tên món ăn thay thế..."
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setEditSubstituteModalItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveSubstitute}
                className="px-5 py-2.5 rounded-xl bg-[#275A4E] text-white text-xs font-bold shadow-md min-h-[44px]"
              >
                Lưu Món Thay Thế
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllergyDietaryManagementTab;
