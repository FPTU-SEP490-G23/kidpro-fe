import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { formatCurrency } from '../../../utils/formatters';
import {
  FeeConfig,
  FeeCycle,
  FeeNature,
  FeeStatus,
  CreateFeeConfigPayload
} from '../../../types/finance.types';

// Hàm chuyển đổi tên khoản thu thành mã định danh không dấu chuẩn mực
const generateFeeCode = (name: string, fallbackId?: any) => {
  if (!name || !name.trim()) {
    return `FEE_${String(fallbackId || Math.random().toString(36).slice(2, 8)).toUpperCase()}`;
  }
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || `FEE_${String(fallbackId || 'CODE').slice(0, 6).toUpperCase()}`;
};

// Dữ liệu rỗng khởi tạo
const DEFAULT_FEE_CONFIGS: FeeConfig[] = [];

export const FeePolicyManagementTab: React.FC = () => {
  const queryClient = useQueryClient();

  // Bộ lọc
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Toast / Thông báo
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Modal / Drawer Thêm mới & Chỉnh sửa
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFee, setEditingFee] = useState<FeeConfig | null>(null);

  // Form State
  const [formFeeCode, setFormFeeCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formAmount, setFormAmount] = useState<number>(1000000);
  const [formCycle, setFormCycle] = useState<FeeCycle>('MONTHLY');
  const [formNature, setFormNature] = useState<FeeNature>('FIXED');
  const [formAgeGroup, setFormAgeGroup] = useState<string>('ALL');
  const [formIsMandatory, setFormIsMandatory] = useState<boolean>(true);
  const [formIsRefundable, setFormIsRefundable] = useState<boolean>(false);
  const [formDailyRefundRate, setFormDailyRefundRate] = useState<number>(35000);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formValidationError, setFormValidationError] = useState<string>('');

  // Modal Xác Nhận Cảnh Báo Xóa / Ngừng Áp Dụng
  const [deactivateModalFee, setDeactivateModalFee] = useState<FeeConfig | null>(null);

  // 1. Fetch danh sách biểu phí (GET /api/finance/fee-configs)
  const {
    data: feeConfigs = DEFAULT_FEE_CONFIGS,
    isLoading,
    refetch
  } = useQuery<FeeConfig[]>({
    queryKey: ['fee-configs'],
    queryFn: async () => {
      try {
        const res: any = await financeApi.getFeeConfigs();
        const list = res?.data || res;
        if (Array.isArray(list)) {
          return list.map((item: any, idx: number) => {
            const rawCode = item.feeCode || item.fee_code;
            const feeCode = rawCode && rawCode !== 'FEE_CODE'
              ? rawCode
              : generateFeeCode(item.name, item.id || idx + 1);

            return {
              id: item.id || `fee-${idx + 1}`,
              feeCode,
              name: item.name || 'Khoản thu',
              type: item.type || 'MONTHLY_FIXED',
              amount: Number(item.amount || 0),
              cycle: (item.cycle || (item.type === 'ONE_TIME' ? 'YEARLY' : item.type === 'PER_ATTENDANCE_DAY' ? 'DAILY' : 'MONTHLY')) as FeeCycle,
              feeNature: (item.feeNature || item.fee_nature || 'FIXED') as FeeNature,
              appliesToAgeGroup: item.appliesToAgeGroup || item.applies_to_age_group || 'ALL',
              isMandatory: item.isMandatory ?? item.is_mandatory ?? true,
              isRefundableOnAbsence: item.isRefundableOnAbsence ?? item.is_refundable_on_absence ?? false,
              dailyRefundRate: Number(item.dailyRefundRate || item.daily_refund_rate || 0),
              status: (item.status || 'ACTIVE') as FeeStatus,
              hasTransactions: item.hasTransactions ?? item.has_transactions ?? false,
              description: item.description || ''
            };
          });
        }
        return [];
      } catch (err: any) {
        console.warn('API /api/finance/fee-configs fallback:', err.message);
        return [];
      }
    }
  });

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingFee(null);
    setFormFeeCode('');
    setFormName('');
    setFormAmount(1000000);
    setFormCycle('MONTHLY');
    setFormNature('FIXED');
    setFormAgeGroup('ALL');
    setFormIsMandatory(true);
    setFormIsRefundable(false);
    setFormDailyRefundRate(35000);
    setFormDescription('');
    setFormValidationError('');
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (fee: FeeConfig) => {
    setEditingFee(fee);
    setFormFeeCode(fee.feeCode);
    setFormName(fee.name);
    setFormAmount(fee.amount);
    setFormCycle(fee.cycle);
    setFormNature(fee.feeNature);
    setFormAgeGroup(fee.appliesToAgeGroup);
    setFormIsMandatory(fee.isMandatory ?? true);
    setFormIsRefundable(fee.isRefundableOnAbsence ?? false);
    setFormDailyRefundRate(fee.dailyRefundRate || 35000);
    setFormDescription(fee.description || '');
    setFormValidationError('');
    setIsModalOpen(true);
  };

  // Mutation Tạo Mới / Cập Nhật Khoản Thu
  const saveFeeMutation = useMutation({
    mutationFn: async (payload: CreateFeeConfigPayload) => {
      // Validate BR-076: Tính duy nhất của mã và tên khoản thu
      // Chỉ kiểm tra trùng mã nếu là tạo mới HOẶC mã được thay đổi so với bản ghi đang sửa
      if (!editingFee || payload.feeCode.trim().toUpperCase() !== editingFee.feeCode.trim().toUpperCase()) {
        const isCodeDuplicate = feeConfigs.some(
          (f) =>
            f.id !== editingFee?.id &&
            f.feeCode.trim().toUpperCase() === payload.feeCode.trim().toUpperCase()
        );
        if (isCodeDuplicate) {
          throw new Error('MSG-137: Mã khoản thu đã tồn tại trên hệ thống. Vui lòng đặt một mã định danh duy nhất.');
        }
      }

      // Chỉ kiểm tra trùng tên nếu là tạo mới HOẶC tên được thay đổi so với bản ghi đang sửa
      if (!editingFee || payload.name.trim().toLowerCase() !== editingFee.name.trim().toLowerCase()) {
        const isNameDuplicate = feeConfigs.some(
          (f) =>
            f.id !== editingFee?.id &&
            f.name.trim().toLowerCase() === payload.name.trim().toLowerCase()
        );
        if (isNameDuplicate) {
          throw new Error('Tên khoản thu này đã tồn tại trong danh mục biểu phí của nhà trường.');
        }
      }

      // Validate: Số tiền khoản thu phải lớn hơn 0 VNĐ (MSG-138)
      if (payload.amount <= 0) {
        throw new Error('MSG-138: Số tiền khoản thu phải lớn hơn 0 VNĐ.');
      }

      const requestPayload: any = {
        name: payload.name,
        type: payload.type,
        amount: payload.amount,
        isRefundableOnAbsence: payload.isRefundableOnAbsence,
        appliesToAgeGroup: payload.appliesToAgeGroup || null,
        dailyRefundRate: payload.dailyRefundRate,
        feeCode: payload.feeCode,
        cycle: payload.cycle,
        feeNature: payload.feeNature,
        isMandatory: payload.isMandatory,
        description: payload.description,
      };

      if (editingFee) {
        return await financeApi.updateFeeConfig(editingFee.id, requestPayload);
      } else {
        return await financeApi.createFeeConfig(requestPayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-configs'] });
      setIsModalOpen(false);
      setToastMessage({
        type: 'success',
        text: editingFee
          ? `Đã cập nhật thông tin khoản thu "${formName}" thành công.`
          : 'MSG-135: Tạo mới danh mục khoản thu thành công'
      });
    },
    onError: (err: any) => {
      setFormValidationError(err.message || 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  });

  // Mutation Ngừng áp dụng / Lưu trữ (Soft Delete theo BR-077)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ fee, newStatus }: { fee: FeeConfig; newStatus: FeeStatus }) => {
      return await financeApi.updateFeeConfig(fee.id, { status: newStatus });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fee-configs'] });
      setDeactivateModalFee(null);
      if (variables.newStatus === 'INACTIVE') {
        setToastMessage({
          type: 'success',
          text: 'MSG-136: Đã ngưng sử dụng và lưu trữ khoản thu học phí cũ thành công.'
        });
      } else {
        setToastMessage({
          type: 'success',
          text: `Đã kích hoạt áp dụng lại khoản thu "${variables.fee.name}".`
        });
      }
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        text: 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.'
      });
    }
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFeeCode.trim()) {
      setFormValidationError('Vui lòng nhập Mã khoản thu.');
      return;
    }
    if (!formName.trim()) {
      setFormValidationError('Vui lòng nhập Tên khoản thu.');
      return;
    }

    const payload: CreateFeeConfigPayload = {
      feeCode: formFeeCode.trim().toUpperCase(),
      name: formName.trim(),
      type: formCycle === 'DAILY' ? 'PER_ATTENDANCE_DAY' : formCycle === 'YEARLY' ? 'ONE_TIME' : 'MONTHLY_FIXED',
      amount: Number(formAmount),
      cycle: formCycle,
      feeNature: formNature,
      appliesToAgeGroup: formAgeGroup,
      isMandatory: formIsMandatory,
      isRefundableOnAbsence: formIsRefundable,
      dailyRefundRate: formIsRefundable ? Number(formDailyRefundRate) : 0,
      description: formDescription.trim()
    };

    saveFeeMutation.mutate(payload);
  };

  // Lọc danh sách
  const filteredFees = useMemo(() => {
    return feeConfigs.filter((f) => {
      const matchAge =
        filterAgeGroup === 'ALL' ||
        f.appliesToAgeGroup === filterAgeGroup ||
        f.appliesToAgeGroup === 'ALL';
      const matchStatus = filterStatus === 'ALL' || f.status === filterStatus;
      const matchSearch =
        f.feeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchAge && matchStatus && matchSearch;
    });
  }, [feeConfigs, filterAgeGroup, filterStatus, searchTerm]);

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
            {toastMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
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

      {/* BANNER THÔNG TIN QUY CHUẨN BIỂU PHÍ (BR-076, BR-077) */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/50 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-[#275A4E] text-white shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1E4D40] text-sm sm:text-base">
                Quản Trị Danh Mục Biểu Phí & Chính Sách Thu Học Phí (BR-076, BR-077)
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Mọi khoản thu áp dụng cho học sinh toàn trường phải được quy chuẩn mã định danh duy nhất. Các khoản thu đã phát sinh hóa đơn được bảo vệ bởi <strong>cơ chế xóa mềm (Soft Delete)</strong>, không thể xóa vĩnh viễn để bảo toàn sổ kế toán tài chính.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 min-h-[44px] active:scale-95 transition whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Khoản Thu Mới</span>
          </button>
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN & BỘ LỌC KHOẢN THU (Header & Toolbar - Section 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Khối áp dụng:
          </span>
          {[
            { id: 'ALL', label: 'Tất cả khối' },
            { id: 'NURSERY', label: 'Nhà trẻ' },
            { id: 'KINDERGARTEN', label: 'Mẫu giáo' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterAgeGroup(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                filterAgeGroup === pill.id
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
            { id: 'ACTIVE', label: 'Đang áp dụng' },
            { id: 'INACTIVE', label: 'Đã ngừng thu' }
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

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã khoản thu, tên khoản thu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-72 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#275A4E] focus:outline-hidden"
            />
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Làm mới danh mục biểu phí"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* BẢNG DANH MỤC KHOẢN THU (Fee Configuration Table - Section 2) */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mã Khoản Thu</th>
                <th className="py-3.5 px-3">Tên Khoản Thu</th>
                <th className="py-3.5 px-3 text-right">Đơn Giá Định Mức</th>
                <th className="py-3.5 px-3 text-center">Chu Kỳ Thu</th>
                <th className="py-3.5 px-3 text-center">Khối Áp Dụng</th>
                <th className="py-3.5 px-3">Tính Chất Khoản Thu</th>
                <th className="py-3.5 px-3 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Đang tải danh mục khoản thu...
                  </td>
                </tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy khoản thu nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => {
                  const isActive = fee.status === 'ACTIVE';

                  return (
                    <tr
                      key={fee.id}
                      className={`hover:bg-slate-50/70 transition ${
                        !isActive ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Mã khoản thu */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs border border-slate-200">
                          {fee.feeCode}
                        </span>
                      </td>

                      {/* Tên khoản thu & mô tả */}
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        <div>
                          <span>{fee.name}</span>
                          {fee.description && (
                            <p className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                              {fee.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Đơn giá định mức (VNĐ) */}
                      <td className="py-3.5 px-3 text-right font-extrabold text-[#275A4E] text-sm">
                        {formatCurrency(fee.amount)}
                      </td>

                      {/* Chu kỳ thu */}
                      <td className="py-3.5 px-3 text-center font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs">
                          {fee.cycle === 'MONTHLY'
                            ? 'Hàng tháng'
                            : fee.cycle === 'YEARLY'
                            ? 'Đầu năm'
                            : 'Theo ngày'}
                        </span>
                      </td>

                      {/* Khối áp dụng */}
                      <td className="py-3.5 px-3 text-center font-medium">
                        <span className="text-xs text-slate-600">
                          {fee.appliesToAgeGroup === 'ALL'
                            ? 'Toàn trường'
                            : fee.appliesToAgeGroup === 'NURSERY'
                            ? 'Nhà trẻ'
                            : 'Mẫu giáo'}
                        </span>
                      </td>

                      {/* Tính chất phí */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              fee.isMandatory
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {fee.isMandatory ? 'Bắt buộc' : 'Tự nguyện'}
                          </span>

                          {fee.isRefundableOnAbsence && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Hoàn tiền vắng ({formatCurrency(fee.dailyRefundRate || 0)}/ngày)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-3 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            <span>Đang áp dụng</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <span>Đã ngừng thu</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(fee)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#275A4E] hover:bg-slate-100 transition"
                            title="Chỉnh sửa cấu hình"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {isActive ? (
                            <button
                              onClick={() => setDeactivateModalFee(fee)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                              title="Ngừng áp dụng (Xóa mềm BR-077)"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                toggleStatusMutation.mutate({ fee, newStatus: 'ACTIVE' })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                              title="Kích hoạt lại khoản thu"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM MỚI & CHỈNH SỬA KHOẢN THU (Section 2 - Modal / Drawer Form) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#275A4E]">
                <Settings className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-800">
                  {editingFee ? 'Hiệu Chỉnh Khoản Thu Học Phí' : 'Thêm Khoản Thu Mới Vào Biểu Phí'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {formValidationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{formValidationError}</span>
                </div>
              )}

              {/* Mã khoản thu */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mã khoản thu (Viết hoa không dấu, vd: TUITION_FEE) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formFeeCode}
                  onChange={(e) =>
                    setFormFeeCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))
                  }
                  placeholder="TUITION_FEE, MEAL_FEE, FACILITY_FEE..."
                  className="w-full rounded-2xl border border-slate-200 p-2.5 font-mono text-slate-800 font-bold focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>

              {/* Tên khoản thu */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tên khoản thu tiếng Việt <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormName(newName);
                    if (!editingFee && (!formFeeCode || formFeeCode === generateFeeCode(formName))) {
                      setFormFeeCode(generateFeeCode(newName));
                    }
                  }}
                  placeholder="Ví dụ: Học phí cơ bản, Tiền ăn bán trú..."
                  className="w-full rounded-2xl border border-slate-200 p-2.5 text-slate-800 font-semibold focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>

              {/* Đơn giá định mức */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Đơn giá định mức (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-2xl border border-slate-200 p-2.5 font-mono text-slate-800 font-bold focus:border-[#275A4E] focus:outline-hidden"
                  />
                  <span className="pointer-events-none absolute right-3 top-2.5 text-slate-400 font-bold">
                    ₫
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Bằng chữ: {formatCurrency(formAmount)}
                </p>
              </div>

              {/* Grid 2 cột: Chu kỳ thu & Khối áp dụng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Chu kỳ thu
                  </label>
                  <select
                    value={formCycle}
                    onChange={(e) => setFormCycle(e.target.value as FeeCycle)}
                    className="w-full rounded-2xl border border-slate-200 p-2.5 text-slate-800 font-semibold focus:border-[#275A4E] focus:outline-hidden"
                  >
                    <option value="MONTHLY">Hàng tháng (MONTHLY)</option>
                    <option value="YEARLY">Đầu năm (YEARLY)</option>
                    <option value="DAILY">Theo ngày (DAILY)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Khối độ tuổi áp dụng
                  </label>
                  <select
                    value={formAgeGroup}
                    onChange={(e) => setFormAgeGroup(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-2.5 text-slate-800 font-semibold focus:border-[#275A4E] focus:outline-hidden"
                  >
                    <option value="ALL">Áp dụng toàn trường (ALL)</option>
                    <option value="NURSERY">Khối Nhà trẻ (NURSERY)</option>
                    <option value="KINDERGARTEN">Khối Mẫu giáo (Mầm, Chồi, Lá)</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes Tính chất */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsMandatory}
                    onChange={(e) => setFormIsMandatory(e.target.checked)}
                    className="h-4 w-4 rounded-md text-[#275A4E] focus:ring-[#275A4E] border-slate-300"
                  />
                  <span className="text-slate-800 font-semibold">
                    Khoản thu bắt buộc theo quy chế nhà trường (Nếu bỏ chọn: Dịch vụ tự nguyện)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsRefundable}
                    onChange={(e) => setFormIsRefundable(e.target.checked)}
                    className="h-4 w-4 rounded-md text-[#275A4E] focus:ring-[#275A4E] border-slate-300"
                  />
                  <span className="text-slate-800 font-semibold">
                    Có được hoàn trả tiền khi học sinh nghỉ học có phép (vd: Tiền ăn bán trú)
                  </span>
                </label>

                {formIsRefundable && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                    <span className="text-slate-600 font-medium">Đơn giá hoàn tiền 1 ngày (VNĐ):</span>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={formDailyRefundRate}
                      onChange={(e) => setFormDailyRefundRate(parseFloat(e.target.value) || 0)}
                      className="w-32 rounded-xl border border-slate-200 p-1.5 text-right font-mono font-bold text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Mô tả ghi chú */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mô tả & Hướng dẫn chính sách thu
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ghi chú chi tiết cho phụ huynh và kế toán..."
                  className="w-full rounded-2xl border border-slate-200 p-2.5 text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saveFeeMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-bold shadow-md min-h-[44px]"
                >
                  {saveFeeMutation.isPending ? 'Đang lưu...' : 'Lưu Khoản Thu (MSG-135)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN NGỪNG ÁP DỤNG (BR-077 XÓA MỀM) */}
      {deactivateModalFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 rounded-2xl bg-amber-100">
                <Archive className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Xác Nhận Ngừng Áp Dụng Khoản Thu
              </h3>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                Khoản thu: <strong>{deactivateModalFee.name}</strong> ({deactivateModalFee.feeCode}).
              </p>
              {deactivateModalFee.hasTransactions ? (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-amber-600 shrink-0" />
                    Bảo Vệ Tính Toàn Vẹn Sổ Kế Toán (BR-077, MSG-139)
                  </p>
                  <p className="mt-1">
                    Khoản thu này <strong>đã có lịch sử phát sinh hóa đơn</strong> giao dịch. Hệ thống sẽ chuyển trạng thái sang <code>INACTIVE</code> và lưu trữ lịch sử kế toán, tuyệt đối không xóa dữ liệu vật lý.
                  </p>
                </div>
              ) : (
                <p>Khoản thu này sẽ chuyển sang trạng thái ngừng áp dụng và không xuất hiện khi lập hóa đơn mới.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeactivateModalFee(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={toggleStatusMutation.isPending}
                onClick={() =>
                  toggleStatusMutation.mutate({
                    fee: deactivateModalFee,
                    newStatus: 'INACTIVE'
                  })
                }
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md min-h-[44px]"
              >
                {toggleStatusMutation.isPending ? 'Đang xử lý...' : 'Xác Nhận Ngừng Thu (MSG-136)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeePolicyManagementTab;
