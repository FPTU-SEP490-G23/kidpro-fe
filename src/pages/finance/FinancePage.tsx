import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { InvoiceStatus, FeeConfig, DiscountRule, LatePickupFeeRule, FeeType } from '../../types/finance.types';
import financeApi from '../../api/financeApi';
import { supabase } from '../../config/supabase';
import {
  Receipt,
  Calculator,
  QrCode,
  CheckCircle2,
  Search,
  AlertCircle,
  Loader2,
  RefreshCw,
  Inbox,
  X,
  Plus,
  Trash2,
  Pencil,
  Settings,
  Percent,
  Timer,
} from 'lucide-react';

interface InvoiceRow {
  invoiceId: string;
  studentName: string;
  className: string;
  baseTuition: number;
  mealAllowanceRefund: number;
  excusedDays: number;
  lateFee: number;
  lateMinutes: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
}

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'fee-configs' | 'discounts' | 'late-pickup'>('invoices');
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [latePickupRules, setLatePickupRules] = useState<LatePickupFeeRule[]>([]);

  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiFeedback, setApiFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [qrModalInvoice, setQrModalInvoice] = useState<InvoiceRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState<{
    name: string;
    type: FeeType;
    amount: number;
    dailyRefundRate: number;
    appliesToAgeGroup: string;
  }>({
    name: '',
    type: 'MONTHLY_FIXED',
    amount: 3500000,
    dailyRefundRate: 40000,
    appliesToAgeGroup: '18-36 tháng (Nhà trẻ)',
  });

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState<{
    name: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    description: string;
  }>({
    name: '',
    discountType: 'PERCENTAGE',
    value: 10,
    description: '',
  });

  const [showLatePickupModal, setShowLatePickupModal] = useState(false);
  const [latePickupForm, setLatePickupForm] = useState<{
    feeConfigId: string;
    minMinutes: number;
    maxMinutes: number;
    penaltyAmount: number;
    description: string;
  }>({
    feeConfigId: '',
    minMinutes: 15,
    maxMinutes: 30,
    penaltyAmount: 50000,
    description: 'Đón muộn 15 - 30 phút',
  });

  // Tải dữ liệu theo Tab
  const loadData = async () => {
    setIsLoading(true);
    setApiFeedback(null);
    try {
      if (activeTab === 'invoices') {
        await loadInvoices();
      } else if (activeTab === 'fee-configs') {
        await loadFeeConfigs();
      } else if (activeTab === 'discounts') {
        await loadDiscountRules();
      } else if (activeTab === 'late-pickup') {
        await loadLatePickupRules();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedMonth]);

  // 1. Tải danh sách Hóa đơn
  const loadInvoices = async () => {
    try {
      const parts = selectedMonth.split('-');
      const monthYearParam = parts.length === 2 ? `${parts[1]}-${parts[0]}` : selectedMonth;

      let dbInvoices: any[] = [];
      try {
        const resp: any = await financeApi.getInvoicesByMonth(monthYearParam);
        if (resp && Array.isArray(resp)) {
          dbInvoices = resp;
        }
      } catch {
        try {
          const { data, error } = await supabase
            .schema('finance')
            .from('invoices')
            .select('id, month_year, total_amount, paid_amount, status, meal_refund_total, late_pickup_fee_total, due_date, student_id')
            .eq('month_year', monthYearParam);

          if (!error && data) {
            dbInvoices = data;
          } else {
            const { data: pubData } = await supabase
              .from('invoices')
              .select('id, month_year, total_amount, paid_amount, status, meal_refund_total, late_pickup_fee_total, due_date, student_id')
              .eq('month_year', monthYearParam);
            if (pubData) dbInvoices = pubData;
          }
        } catch {
          const { data: pubData } = await supabase
            .from('invoices')
            .select('id, month_year, total_amount, paid_amount, status, meal_refund_total, late_pickup_fee_total, due_date, student_id')
            .eq('month_year', monthYearParam);
          if (pubData) dbInvoices = pubData;
        }
      }

      if (dbInvoices && dbInvoices.length > 0) {
        let studentsData: any[] = [];
        try {
          const { data: sAcad, error: sErr } = await supabase.schema('academic').from('students').select('id, full_name, class_id');
          if (!sErr && sAcad) {
            studentsData = sAcad;
          } else {
            const { data: sPub } = await supabase.from('students').select('id, full_name, class_id');
            if (sPub) studentsData = sPub;
          }
        } catch {
          const { data: sPub } = await supabase.from('students').select('id, full_name, class_id');
          if (sPub) studentsData = sPub;
        }

        let classesData: any[] = [];
        try {
          const { data: cCore, error: cErr } = await supabase.schema('core').from('classes').select('id, name');
          if (!cErr && cCore) {
            classesData = cCore;
          } else {
            const { data: cPub } = await supabase.from('classes').select('id, name');
            if (cPub) classesData = cPub;
          }
        } catch {
          const { data: cPub } = await supabase.from('classes').select('id, name');
          if (cPub) classesData = cPub;
        }

        const rows: InvoiceRow[] = dbInvoices.map((inv: any) => {
          const matchedStu = studentsData?.find((s: any) => s.id === (inv.student?.id || inv.student_id));
          const matchedClass = classesData?.find((c: any) => c.id === matchedStu?.class_id);

          return {
            invoiceId: inv.id ? `INV-${inv.id.substring(0, 8)}` : 'INV-001',
            studentName: matchedStu?.full_name || inv.student?.fullName || 'Học sinh',
            className: matchedClass?.name || 'Chưa xếp lớp',
            baseTuition: Number(inv.totalAmount || inv.total_amount || 0) + Number(inv.mealRefundTotal || inv.meal_refund_total || 0) - Number(inv.latePickupFeeTotal || inv.late_pickup_fee_total || 0),
            mealAllowanceRefund: Number(inv.mealRefundTotal || inv.meal_refund_total || 0),
            excusedDays: 0,
            lateFee: Number(inv.latePickupFeeTotal || inv.late_pickup_fee_total || 0),
            lateMinutes: 0,
            totalAmount: Number(inv.totalAmount || inv.total_amount || 0),
            status: (inv.status as InvoiceStatus) || 'PENDING',
            dueDate: inv.dueDate ? inv.dueDate.substring(0, 10) : inv.due_date ? inv.due_date.substring(0, 10) : selectedMonth + '-10',
          };
        });
        setInvoices(rows);
      } else {
        setInvoices([]);
      }
    } catch (err: any) {
      console.warn('Lỗi tải hóa đơn:', err.message);
      setInvoices([]);
    }
  };

  // 2. Tải Biểu phí (Task 2)
  const loadFeeConfigs = async () => {
    try {
      let data: any[] = [];
      try {
        const resp: any = await financeApi.getFeeConfigs();
        if (resp && Array.isArray(resp)) data = resp;
      } catch {
        try {
          const { data: fData, error: fErr } = await supabase.schema('finance').from('fee_configs').select('*');
          if (!fErr && fData) {
            data = fData;
          } else {
            const { data: sbData } = await supabase.from('fee_configs').select('*');
            if (sbData) data = sbData;
          }
        } catch {
          const { data: sbData } = await supabase.from('fee_configs').select('*');
          if (sbData) data = sbData;
        }
      }

      if (data && data.length > 0) {
        setFeeConfigs(
          data.map((f: any) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            amount: Number(f.amount || 0),
            dailyRefundRate: Number(f.dailyRefundRate || f.daily_refund_rate || 0),
            appliesToAgeGroup: f.appliesToAgeGroup || f.applies_to_age_group || 'Toàn trường',
            isRefundableOnAbsence: f.isRefundableOnAbsence ?? f.is_refundable_on_absence ?? false,
          }))
        );
      } else {
        setFeeConfigs([]);
      }
    } catch (err: any) {
      console.warn('Lỗi tải fee configs:', err.message);
      setFeeConfigs([]);
    }
  };

  // 3. Tải Quy tắc giảm trừ (Task 2)
  const loadDiscountRules = async () => {
    try {
      let data: any[] = [];
      try {
        const resp: any = await financeApi.getDiscountRules();
        if (resp && Array.isArray(resp)) data = resp;
      } catch {
        try {
          const { data: fData, error: fErr } = await supabase.schema('finance').from('discount_rules').select('*');
          if (!fErr && fData) {
            data = fData;
          } else {
            const { data: sbData } = await supabase.from('discount_rules').select('*');
            if (sbData) data = sbData;
          }
        } catch {
          const { data: sbData } = await supabase.from('discount_rules').select('*');
          if (sbData) data = sbData;
        }
      }

      if (data && data.length > 0) {
        setDiscountRules(
          data.map((d: any) => ({
            id: d.id,
            name: d.name,
            discountType: (d.discountType || d.discount_type || 'PERCENTAGE') as any,
            value: Number(d.value || 0),
            description: d.description || '',
            isActive: d.isActive ?? d.is_active ?? true,
          }))
        );
      } else {
        setDiscountRules([]);
      }
    } catch (err: any) {
      console.warn('Lỗi tải discount rules:', err.message);
      setDiscountRules([]);
    }
  };

  // 4. Tải Khung phạt đón muộn (Task 3)
  const loadLatePickupRules = async () => {
    try {
      let data: any[] = [];
      try {
        const resp: any = await financeApi.getLatePickupRules();
        if (resp && Array.isArray(resp)) data = resp;
      } catch {
        try {
          const { data: fData, error: fErr } = await supabase.schema('finance').from('late_pickup_fee_rules').select('*');
          if (!fErr && fData) {
            data = fData;
          } else {
            const { data: sbData } = await supabase.from('late_pickup_fee_rules').select('*');
            if (sbData) data = sbData;
          }
        } catch {
          const { data: sbData } = await supabase.from('late_pickup_fee_rules').select('*');
          if (sbData) data = sbData;
        }
      }

      if (data && data.length > 0) {
        setLatePickupRules(
          data.map((r: any) => ({
            id: r.id,
            feeConfigId: r.feeConfig?.id || r.fee_config_id,
            feeConfigName: r.feeConfig?.name || 'Phí đón muộn',
            minMinutes: r.minMinutes ?? r.min_minutes ?? 0,
            maxMinutes: r.maxMinutes ?? r.max_minutes ?? 0,
            penaltyAmount: Number(r.penaltyAmount || r.penalty_amount || 0),
            description: r.description || '',
          }))
        );
      } else {
        setLatePickupRules([]);
      }
    } catch (err: any) {
      console.warn('Lỗi tải late pickup rules:', err.message);
      setLatePickupRules([]);
    }
  };

  // Thêm Biểu phí mới (Task 2)
  const handleCreateFeeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.name.trim()) return;
    try {
      const payload = {
        name: feeForm.name.trim(),
        type: feeForm.type,
        amount: feeForm.amount,
        daily_refund_rate: feeForm.dailyRefundRate,
        applies_to_age_group: feeForm.appliesToAgeGroup,
        is_refundable_on_absence: feeForm.dailyRefundRate > 0,
      };

      try {
        await financeApi.createFeeConfig(feeForm);
      } catch {
        const fRes = await supabase.schema('finance').from('fee_configs').insert([payload]);
        if (fRes.error) {
          const pubRes = await supabase.from('fee_configs').insert([payload]);
          if (pubRes.error) throw fRes.error;
        }
      }

      setShowFeeModal(false);
      setFeeForm({ name: '', type: 'MONTHLY_FIXED', amount: 3500000, dailyRefundRate: 40000, appliesToAgeGroup: '18-36 tháng (Nhà trẻ)' });
      setApiFeedback({ type: 'success', text: '✅ Đã thêm cấu hình biểu phí thành công!' });
      await loadFeeConfigs();
    } catch (err: any) {
      console.error('Lỗi thêm biểu phí:', err);
      const is403 = err.status === 403 || err.code === '42501' || String(err.message).toLowerCase().includes('row-level security');
      const is404 = err.status === 404 || String(err.message).toLowerCase().includes('not found');
      setApiFeedback({
        type: 'error',
        text: is403
          ? '⚠️ Supabase từ chối quyền (403 Forbidden - RLS): Bảng "finance.fee_configs" chưa được cấp quyền INSERT hoặc đang bật Row Level Security.'
          : is404
          ? '⚠️ Lỗi 404 (Not Found): Bảng "fee_configs" chưa có trong schema finance/public hoặc schema "finance" chưa được thêm vào Exposed schemas trên Supabase.'
          : `⚠️ Không thể thêm biểu phí: ${err.message || 'Lỗi không xác định'}`,
      });
    }
  };

  // Thêm Chính sách giảm giá mới (Task 2)
  const handleCreateDiscountRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.name.trim()) return;
    try {
      const payload = {
        name: discountForm.name.trim(),
        discount_type: discountForm.discountType,
        value: discountForm.value,
        description: discountForm.description.trim(),
        is_active: true,
      };

      try {
        await financeApi.createDiscountRule(discountForm);
      } catch {
        const fRes = await supabase.schema('finance').from('discount_rules').insert([payload]);
        if (fRes.error) {
          const pubRes = await supabase.from('discount_rules').insert([payload]);
          if (pubRes.error) throw fRes.error;
        }
      }

      setShowDiscountModal(false);
      setDiscountForm({ name: '', discountType: 'PERCENTAGE', value: 10, description: '' });
      setApiFeedback({ type: 'success', text: '✅ Đã thêm chính sách miễn giảm thành công!' });
      await loadDiscountRules();
    } catch (err: any) {
      console.error('Lỗi thêm chính sách:', err);
      const is403 = err.status === 403 || err.code === '42501' || String(err.message).toLowerCase().includes('row-level security');
      const is404 = err.status === 404 || String(err.message).toLowerCase().includes('not found');
      setApiFeedback({
        type: 'error',
        text: is403
          ? '⚠️ Supabase từ chối quyền (403 Forbidden - RLS): Bảng "finance.discount_rules" chưa được cấp quyền INSERT hoặc đang bật Row Level Security.'
          : is404
          ? '⚠️ Lỗi 404 (Not Found): Bảng "discount_rules" chưa có trong schema finance/public hoặc schema "finance" chưa được thêm vào Exposed schemas trên Supabase.'
          : `⚠️ Không thể thêm chính sách: ${err.message || 'Lỗi không xác định'}`,
      });
    }
  };

  // Thêm Khung phạt đón muộn mới (Task 3)
  const handleCreateLatePickupRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        fee_config_id: latePickupForm.feeConfigId || null,
        min_minutes: latePickupForm.minMinutes,
        max_minutes: latePickupForm.maxMinutes,
        penalty_amount: latePickupForm.penaltyAmount,
        description: latePickupForm.description.trim(),
      };

      try {
        await financeApi.createLatePickupRule(latePickupForm);
      } catch {
        const fRes = await supabase.schema('finance').from('late_pickup_fee_rules').insert([payload]);
        if (fRes.error) {
          const pubRes = await supabase.from('late_pickup_fee_rules').insert([payload]);
          if (pubRes.error) throw fRes.error;
        }
      }

      setShowLatePickupModal(false);
      setApiFeedback({ type: 'success', text: '✅ Đã thêm khung phạt đón muộn thành công!' });
      await loadLatePickupRules();
    } catch (err: any) {
      console.error('Lỗi thêm khung phạt:', err);
      const is403 = err.status === 403 || err.code === '42501' || String(err.message).toLowerCase().includes('row-level security');
      const is404 = err.status === 404 || String(err.message).toLowerCase().includes('not found');
      setApiFeedback({
        type: 'error',
        text: is403
          ? '⚠️ Supabase từ chối quyền (403 Forbidden - RLS): Bảng "finance.late_pickup_fee_rules" chưa được cấp quyền INSERT hoặc đang bật Row Level Security.'
          : is404
          ? '⚠️ Lỗi 404 (Not Found): Bảng "late_pickup_fee_rules" chưa có trong schema finance/public hoặc schema "finance" chưa được thêm vào Exposed schemas trên Supabase.'
          : `⚠️ Không thể thêm khung phạt: ${err.message || 'Lỗi không xác định'}`,
      });
    }
  };

  // Xóa khoản phí
  const handleDeleteFeeConfig = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cấu hình khoản thu này?')) return;
    try {
      try {
        await financeApi.deleteFeeConfig(id);
      } catch {
        const fRes = await supabase.schema('finance').from('fee_configs').delete().eq('id', id);
        if (fRes.error) {
          const pubRes = await supabase.from('fee_configs').delete().eq('id', id);
          if (pubRes.error) throw fRes.error;
        }
      }
      setApiFeedback({ type: 'success', text: '✅ Đã xóa cấu hình khoản thu.' });
      await loadFeeConfigs();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi xóa: ${err.message}` });
    }
  };

  // Xóa chính sách miễn giảm
  const handleDeleteDiscountRule = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chính sách miễn giảm này?')) return;
    try {
      try {
        await financeApi.deleteDiscountRule(id);
      } catch {
        const fRes = await supabase.schema('finance').from('discount_rules').delete().eq('id', id);
        if (fRes.error) {
          const pubRes = await supabase.from('discount_rules').delete().eq('id', id);
          if (pubRes.error) throw fRes.error;
        }
      }
      setApiFeedback({ type: 'success', text: '✅ Đã xóa chính sách miễn giảm.' });
      await loadDiscountRules();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi xóa: ${err.message}` });
    }
  };

  // Xóa khung phạt đón muộn
  const handleDeleteLatePickupRule = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khung phạt đón muộn này?')) return;
    try {
      try {
        await financeApi.deleteLatePickupRule(id);
      } catch {
        const fRes = await supabase.schema('finance').from('late_pickup_fee_rules').delete().eq('id', id);
        if (fRes.error) {
          const pubRes = await supabase.from('late_pickup_fee_rules').delete().eq('id', id);
          if (pubRes.error) throw fRes.error;
        }
      }
      setApiFeedback({ type: 'success', text: '✅ Đã xóa khung phạt đón muộn.' });
      await loadLatePickupRules();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi xóa: ${err.message}` });
    }
  };

  // ================= CHỈNH SỬA KHOẢN THU (FEE CONFIG) =================
  const [showEditFeeModal, setShowEditFeeModal] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editFeeForm, setEditFeeForm] = useState<{
    name: string;
    type: FeeType;
    amount: number;
    dailyRefundRate: number;
    appliesToAgeGroup: string;
  }>({
    name: '',
    type: 'MONTHLY_FIXED',
    amount: 3500000,
    dailyRefundRate: 40000,
    appliesToAgeGroup: '18-36 tháng (Nhà trẻ)',
  });

  const handleOpenEditFee = (fee: FeeConfig) => {
    setEditingFeeId(fee.id);
    setEditFeeForm({
      name: fee.name,
      type: fee.type,
      amount: fee.amount,
      dailyRefundRate: fee.dailyRefundRate || 0,
      appliesToAgeGroup: fee.appliesToAgeGroup || '18-36 tháng (Nhà trẻ)',
    });
    setShowEditFeeModal(true);
  };

  const handleUpdateFeeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeeId || !editFeeForm.name.trim()) return;

    try {
      const payload = {
        name: editFeeForm.name.trim(),
        type: editFeeForm.type,
        amount: editFeeForm.amount,
        daily_refund_rate: editFeeForm.dailyRefundRate,
        applies_to_age_group: editFeeForm.appliesToAgeGroup,
      };

      const fRes = await supabase.schema('finance').from('fee_configs').update(payload).eq('id', editingFeeId);
      if (fRes.error) {
        const pubRes = await supabase.from('fee_configs').update(payload).eq('id', editingFeeId);
        if (pubRes.error) throw fRes.error;
      }

      setShowEditFeeModal(false);
      setEditingFeeId(null);
      setApiFeedback({ type: 'success', text: `✅ Đã cập nhật khoản thu "${editFeeForm.name}" thành công!` });
      await loadFeeConfigs();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi cập nhật khoản thu: ${err.message}` });
    }
  };

  // ================= CHỈNH SỬA CHÍNH SÁCH MIỄN GIẢM =================
  const [showEditDiscountModal, setShowEditDiscountModal] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [editDiscountForm, setEditDiscountForm] = useState<{
    name: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    description: string;
    isActive: boolean;
  }>({
    name: '',
    discountType: 'PERCENTAGE',
    value: 10,
    description: '',
    isActive: true,
  });

  const handleOpenEditDiscount = (d: DiscountRule) => {
    setEditingDiscountId(d.id);
    setEditDiscountForm({
      name: d.name,
      discountType: d.discountType,
      value: d.value,
      description: d.description || '',
      isActive: d.isActive ?? true,
    });
    setShowEditDiscountModal(true);
  };

  const handleUpdateDiscountRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscountId || !editDiscountForm.name.trim()) return;

    try {
      const payload = {
        name: editDiscountForm.name.trim(),
        discount_type: editDiscountForm.discountType,
        value: editDiscountForm.value,
        description: editDiscountForm.description.trim(),
        is_active: editDiscountForm.isActive,
      };

      const fRes = await supabase.schema('finance').from('discount_rules').update(payload).eq('id', editingDiscountId);
      if (fRes.error) {
        const pubRes = await supabase.from('discount_rules').update(payload).eq('id', editingDiscountId);
        if (pubRes.error) throw fRes.error;
      }

      setShowEditDiscountModal(false);
      setEditingDiscountId(null);
      setApiFeedback({ type: 'success', text: `✅ Đã cập nhật chính sách "${editDiscountForm.name}" thành công!` });
      await loadDiscountRules();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi cập nhật chính sách: ${err.message}` });
    }
  };

  // ================= CHỈNH SỬA KHUNG PHẠT ĐÓN MUỘN =================
  const [showEditLatePickupModal, setShowEditLatePickupModal] = useState(false);
  const [editingLatePickupId, setEditingLatePickupId] = useState<string | null>(null);
  const [editLatePickupForm, setEditLatePickupForm] = useState<{
    minMinutes: number;
    maxMinutes: number;
    penaltyAmount: number;
    description: string;
  }>({
    minMinutes: 15,
    maxMinutes: 30,
    penaltyAmount: 50000,
    description: '',
  });

  const handleOpenEditLatePickup = (r: LatePickupFeeRule) => {
    setEditingLatePickupId(r.id);
    setEditLatePickupForm({
      minMinutes: r.minMinutes,
      maxMinutes: r.maxMinutes,
      penaltyAmount: r.penaltyAmount,
      description: r.description || '',
    });
    setShowEditLatePickupModal(true);
  };

  const handleUpdateLatePickupRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLatePickupId) return;

    try {
      const payload = {
        min_minutes: editLatePickupForm.minMinutes,
        max_minutes: editLatePickupForm.maxMinutes,
        penalty_amount: editLatePickupForm.penaltyAmount,
        description: editLatePickupForm.description.trim(),
      };

      const fRes = await supabase.schema('finance').from('late_pickup_fee_rules').update(payload).eq('id', editingLatePickupId);
      if (fRes.error) {
        const pubRes = await supabase.from('late_pickup_fee_rules').update(payload).eq('id', editingLatePickupId);
        if (pubRes.error) throw fRes.error;
      }

      setShowEditLatePickupModal(false);
      setEditingLatePickupId(null);
      setApiFeedback({ type: 'success', text: '✅ Đã cập nhật khung phạt đón muộn thành công!' });
      await loadLatePickupRules();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi cập nhật khung phạt: ${err.message}` });
    }
  };

  // ================= QUẢN LÝ TRẠNG THÁI & HỦY HÓA ĐƠN =================
  const handleToggleInvoiceStatus = async (invoiceId: string, currentStatus: InvoiceStatus) => {
    const newStatus: InvoiceStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    const label = newStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHỜ ĐÓNG TIỀN';
    try {
      const payload = { status: newStatus };
      const fRes = await supabase.schema('finance').from('invoices').update(payload).eq('id', invoiceId);
      if (fRes.error) {
        const pubRes = await supabase.from('invoices').update(payload).eq('id', invoiceId);
        if (pubRes.error) throw fRes.error;
      }

      setApiFeedback({ type: 'success', text: `✅ Đã chuyển trạng thái hóa đơn sang "${label}"!` });
      await loadInvoices();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi cập nhật trạng thái: ${err.message}` });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy / xóa hóa đơn học phí này?')) return;
    try {
      const fRes = await supabase.schema('finance').from('invoices').delete().eq('id', invoiceId);
      if (fRes.error) {
        const pubRes = await supabase.from('invoices').delete().eq('id', invoiceId);
        if (pubRes.error) throw fRes.error;
      }

      setApiFeedback({ type: 'success', text: '✅ Đã xóa hóa đơn học phí.' });
      await loadInvoices();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi xóa hóa đơn: ${err.message}` });
    }
  };

  // Chạy quyết toán học phí tháng
  const handleGenerateInvoices = async () => {
    setIsGenerating(true);
    setApiFeedback(null);
    try {
      const parts = selectedMonth.split('-');
      const monthYearParam = parts.length === 2 ? `${parts[1]}-${parts[0]}` : selectedMonth;
      await financeApi.generateMonthlyInvoices(monthYearParam);
      setApiFeedback({
        type: 'success',
        text: `✅ Đã chạy quyết toán tháng ${selectedMonth} thành công trên Backend & Supabase!`,
      });
      await loadInvoices();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Chưa kết nối được Backend';
      setApiFeedback({
        type: 'error',
        text: `⚠️ Lỗi gọi API quyết toán: ${errMsg}.`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Receipt className="h-7 w-7 text-indigo-600" />
            <span>Kế Toán & Quyết Toán Học Phí</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý biểu phí thu, chính sách miễn giảm, khung phạt đón muộn và quyết toán học phí động
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Thông báo phản hồi */}
      {apiFeedback && (
        <div
          className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
            apiFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {apiFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{apiFeedback.text}</span>
        </div>
      )}

      {/* Tabs điều hướng */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Hóa đơn & Quyết toán ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fee-configs')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'fee-configs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Cấu hình Biểu phí</span>
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'discounts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Percent className="h-4 w-4" />
          <span>Chính sách Miễn giảm</span>
        </button>

        <button
          onClick={() => setActiveTab('late-pickup')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'late-pickup'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Timer className="h-4 w-4" />
          <span>Khung phạt Đón muộn</span>
        </button>
      </div>

      {/* TAB 1: HÓA ĐƠN & QUYẾT TOÁN */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Thanh công cụ tháng & Quyết toán */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Tháng quyết toán:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 font-bold focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học sinh, lớp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <button
                onClick={handleGenerateInvoices}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calculator className="h-3.5 w-3.5" />}
                <span>{isGenerating ? 'Đang quyết toán...' : 'Chạy quyết toán tháng'}</span>
              </button>
            </div>
          </div>

          {/* Bảng Hóa đơn */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-sm font-medium text-slate-600">Đang tải danh sách hóa đơn...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                  <Inbox className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">Chưa có hóa đơn tháng {selectedMonth}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Nhấn "Chạy quyết toán tháng" để tính toán học phí động tự động trừ tiền ăn theo ngày vắng có phép.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Mã HĐ</th>
                      <th className="py-3 px-4">Học sinh</th>
                      <th className="py-3 px-4">Lớp</th>
                      <th className="py-3 px-4 text-right">Học phí gốc</th>
                      <th className="py-3 px-4 text-right">Trừ tiền ăn</th>
                      <th className="py-3 px-4 text-right">Phạt đón muộn</th>
                      <th className="py-3 px-4 text-right">Tổng phải đóng</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.invoiceId} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400 font-semibold">{inv.invoiceId}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{inv.studentName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{inv.className}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">{formatCurrency(inv.baseTuition)}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                          {inv.mealAllowanceRefund > 0 ? `-${formatCurrency(inv.mealAllowanceRefund)}` : '0đ'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                          {inv.lateFee > 0 ? `+${formatCurrency(inv.lateFee)}` : '0đ'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-indigo-700">{formatCurrency(inv.totalAmount)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-700'
                                : inv.status === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {inv.status === 'PAID' && 'Đã thanh toán'}
                            {inv.status === 'PENDING' && 'Chờ đóng tiền'}
                            {inv.status === 'OVERDUE' && 'Quá hạn'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setQrModalInvoice(inv)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition"
                              title="Tạo VietQR"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleInvoiceStatus(inv.invoiceId, inv.status)}
                              className={`rounded-lg p-1.5 transition ${
                                inv.status === 'PAID'
                                  ? 'text-emerald-600 hover:bg-emerald-50 hover:text-amber-600'
                                  : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                              }`}
                              title={inv.status === 'PAID' ? 'Đổi sang Chờ đóng tiền' : 'Xác nhận Đã thanh toán'}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv.invoiceId)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Hủy / Xóa hóa đơn"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CẤU HÌNH BIỂU PHÍ (TASK 2) */}
      {activeTab === 'fee-configs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Quản lý các khoản thu học phí cố định hàng tháng, tiền ăn theo ngày và mức hoàn tiền vắng học.
            </p>
            <button
              onClick={() => setShowFeeModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Khoản Thu Mới</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-sm font-medium text-slate-600">Đang tải danh sách biểu phí...</p>
              </div>
            ) : feeConfigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Inbox className="h-10 w-10 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Chưa có khoản thu nào</h3>
                <p className="text-xs text-slate-400 mt-1">Bấm nút trên để tạo biểu phí mới.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Tên khoản thu</th>
                    <th className="py-3 px-4">Loại khoản thu</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    <th className="py-3 px-4 text-right">Hoàn trả/ngày vắng (Task 2)</th>
                    <th className="py-3 px-4">Áp dụng cho</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeConfigs.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{f.name}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-indigo-600">
                        {f.type === 'MONTHLY_FIXED' ? 'Cố định hàng tháng' : f.type === 'PER_ATTENDANCE_DAY' ? 'Theo ngày điểm danh' : 'Một lần'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">{formatCurrency(f.amount)}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                        {f.dailyRefundRate ? `${formatCurrency(f.dailyRefundRate)}/ngày` : 'Không hoàn'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{f.appliesToAgeGroup}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditFee(f)}
                            className="rounded-lg p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Sửa khoản thu"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFeeConfig(f.id)}
                            className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Xóa khoản thu"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CHÍNH SÁCH MIỄN GIẢM (TASK 2) */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Quản lý chính sách giảm trừ học phí (giảm theo % hoặc số tiền cố định cho con thứ 2, hộ nghèo...).
            </p>
            <button
              onClick={() => setShowDiscountModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Chính Sách Mới</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-sm font-medium text-slate-600">Đang tải danh sách chính sách...</p>
              </div>
            ) : discountRules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Inbox className="h-10 w-10 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Chưa có chính sách miễn giảm nào</h3>
                <p className="text-xs text-slate-400 mt-1">Bấm nút trên để tạo chính sách miễn giảm mới.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Tên chính sách</th>
                    <th className="py-3 px-4">Hình thức giảm</th>
                    <th className="py-3 px-4 text-right">Mức giảm</th>
                    <th className="py-3 px-4">Mô tả</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {discountRules.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{d.name}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                        {d.discountType === 'PERCENTAGE' ? 'Theo phần trăm (%)' : 'Số tiền cố định (VNĐ)'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-600">
                        {d.discountType === 'PERCENTAGE' ? `${d.value}%` : formatCurrency(d.value)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{d.description || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            d.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {d.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditDiscount(d)}
                            className="rounded-lg p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Sửa chính sách miễn giảm"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDiscountRule(d.id)}
                            className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Xóa chính sách"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: KHUNG PHẠT ĐÓN MUỘN (TASK 3) */}
      {activeTab === 'late-pickup' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Quy định các khung phạt đón muộn sau 17:00 chiều (tự động cộng dồn vào hóa đơn học phí tháng).
            </p>
            <button
              onClick={() => setShowLatePickupModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Khung Phạt Đón Muộn</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-sm font-medium text-slate-600">Đang tải danh sách khung phạt...</p>
              </div>
            ) : latePickupRules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Inbox className="h-10 w-10 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Chưa có khung phạt đón muộn nào</h3>
                <p className="text-xs text-slate-400 mt-1">Bấm nút trên để tạo khung phạt theo số phút.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Khoảng thời gian muộn</th>
                    <th className="py-3 px-4 text-right">Mức tiền phạt</th>
                    <th className="py-3 px-4">Mô tả chi tiết</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latePickupRules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {r.minMinutes} - {r.maxMinutes} phút
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {formatCurrency(r.penaltyAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{r.description || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditLatePickup(r)}
                            className="rounded-lg p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Sửa khung phạt"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLatePickupRule(r.id)}
                            className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Xóa khung phạt"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL THÊM BIỂU PHÍ (TASK 2) */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Thêm Khoản Thu Mới</h3>
              <button onClick={() => setShowFeeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFeeConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên khoản thu</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Học phí chính khóa, Tiền ăn bán trú..."
                  value={feeForm.name}
                  onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Loại thu</label>
                  <select
                    value={feeForm.type}
                    onChange={(e) => setFeeForm({ ...feeForm, type: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="MONTHLY_FIXED">Cố định tháng</option>
                    <option value="PER_ATTENDANCE_DAY">Theo ngày ăn</option>
                    <option value="ONE_TIME">Đóng một lần</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Độ tuổi áp dụng</label>
                  <select
                    value={feeForm.appliesToAgeGroup}
                    onChange={(e) => setFeeForm({ ...feeForm, appliesToAgeGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium bg-white focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="18-36 tháng (Nhà trẻ)">18-36 tháng (Nhà Mầm)</option>
                    <option value="3-4 tuổi (Khối Mầm)">3-4 tuổi (Khối Chồi)</option>
                    <option value="4-5 tuổi (Khối Chồi)">4-5 tuổi (Khối Lá)</option>
                    <option value="5-6 tuổi (Khối Lá)">5-6 tuổi (Khối Hoa)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-indigo-700 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hoàn vắng/ngày</label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={feeForm.dailyRefundRate}
                    onChange={(e) => setFeeForm({ ...feeForm, dailyRefundRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-emerald-700 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Khoản Thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM MIỄN GIẢM (TASK 2) */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Thêm Chính Sách Miễn Giảm</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDiscountRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên chính sách</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giảm 10% cho bé thứ 2, Hộ gia đình chính sách..."
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hình thức giảm</label>
                  <select
                    value={discountForm.discountType}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giá trị giảm</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-indigo-700 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả / Điều kiện</label>
                <textarea
                  rows={2}
                  value={discountForm.description}
                  onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Chính Sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM KHUNG PHẠT ĐÓN MUỘN (TASK 3) */}
      {showLatePickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Thêm Khung Phạt Đón Muộn</h3>
              <button onClick={() => setShowLatePickupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLatePickupRule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Từ số phút (min)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={latePickupForm.minMinutes}
                    onChange={(e) => setLatePickupForm({ ...latePickupForm, minMinutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Đến số phút (max)</label>
                  <input
                    type="number"
                    required
                    min={latePickupForm.minMinutes}
                    value={latePickupForm.maxMinutes}
                    onChange={(e) => setLatePickupForm({ ...latePickupForm, maxMinutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền phạt (VNĐ)</label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={10000}
                  value={latePickupForm.penaltyAmount}
                  onChange={(e) => setLatePickupForm({ ...latePickupForm, penaltyAmount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-rose-600 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả quy tắc</label>
                <input
                  type="text"
                  value={latePickupForm.description}
                  onChange={(e) => setLatePickupForm({ ...latePickupForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLatePickupModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Khung Phạt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIETQR */}
      {qrModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="font-bold text-slate-800 text-sm">VietQR Chuyển Khoản</span>
              <button onClick={() => setQrModalInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-200">
              <QrCode className="h-44 w-44 text-indigo-900" />
              <p className="text-xs text-slate-500 mt-2">Quét bằng ứng dụng Ngân hàng</p>
            </div>
            <div className="text-left bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs space-y-1">
              <p><span className="text-slate-500">Học sinh:</span> <strong>{qrModalInvoice.studentName}</strong></p>
              <p><span className="text-slate-500">Mã hóa đơn:</span> <strong className="font-mono">{qrModalInvoice.invoiceId}</strong></p>
              <p><span className="text-slate-500">Số tiền:</span> <strong className="text-indigo-600 text-sm">{formatCurrency(qrModalInvoice.totalAmount)}</strong></p>
            </div>
            <button
              onClick={() => setQrModalInvoice(null)}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA BIỂU PHÍ ================= */}
      {showEditFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <Pencil className="h-5 w-5" />
                <span>Chỉnh Sửa Khoản Thu</span>
              </div>
              <button onClick={() => setShowEditFeeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateFeeConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên khoản thu (*)</label>
                <input
                  type="text"
                  required
                  value={editFeeForm.name}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Loại thu</label>
                  <select
                    value={editFeeForm.type}
                    onChange={(e) => setEditFeeForm({ ...editFeeForm, type: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="MONTHLY_FIXED">Cố định tháng</option>
                    <option value="PER_ATTENDANCE_DAY">Theo ngày ăn</option>
                    <option value="ONE_TIME">Đóng một lần</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Độ tuổi áp dụng</label>
                  <select
                    value={editFeeForm.appliesToAgeGroup}
                    onChange={(e) => setEditFeeForm({ ...editFeeForm, appliesToAgeGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium bg-white focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="18-36 tháng (Nhà trẻ)">18-36 tháng (Nhà Mầm)</option>
                    <option value="3-4 tuổi (Khối Mầm)">3-4 tuổi (Khối Chồi)</option>
                    <option value="4-5 tuổi (Khối Chồi)">4-5 tuổi (Khối Lá)</option>
                    <option value="5-6 tuổi (Khối Lá)">5-6 tuổi (Khối Hoa)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={editFeeForm.amount}
                    onChange={(e) => setEditFeeForm({ ...editFeeForm, amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-indigo-700 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hoàn vắng/ngày</label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={editFeeForm.dailyRefundRate}
                    onChange={(e) => setEditFeeForm({ ...editFeeForm, dailyRefundRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-emerald-700 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditFeeModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA CHÍNH SÁCH MIỄN GIẢM ================= */}
      {showEditDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <Pencil className="h-5 w-5" />
                <span>Chỉnh Sửa Chính Sách Miễn Giảm</span>
              </div>
              <button onClick={() => setShowEditDiscountModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateDiscountRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên chính sách (*)</label>
                <input
                  type="text"
                  required
                  value={editDiscountForm.name}
                  onChange={(e) => setEditDiscountForm({ ...editDiscountForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hình thức giảm</label>
                  <select
                    value={editDiscountForm.discountType}
                    onChange={(e) => setEditDiscountForm({ ...editDiscountForm, discountType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giá trị giảm</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editDiscountForm.value}
                    onChange={(e) => setEditDiscountForm({ ...editDiscountForm, value: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-indigo-700 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả / Điều kiện</label>
                <textarea
                  rows={2}
                  value={editDiscountForm.description}
                  onChange={(e) => setEditDiscountForm({ ...editDiscountForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editDiscountForm.isActive}
                  onChange={(e) => setEditDiscountForm({ ...editDiscountForm, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="editIsActive" className="text-xs font-semibold text-slate-700">
                  Đang kích hoạt áp dụng
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditDiscountModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA KHUNG PHẠT ĐÓN MUỘN ================= */}
      {showEditLatePickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <Pencil className="h-5 w-5" />
                <span>Chỉnh Sửa Khung Phạt Đón Muộn</span>
              </div>
              <button onClick={() => setShowEditLatePickupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateLatePickupRule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Từ số phút (min)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editLatePickupForm.minMinutes}
                    onChange={(e) => setEditLatePickupForm({ ...editLatePickupForm, minMinutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Đến số phút (max)</label>
                  <input
                    type="number"
                    required
                    min={editLatePickupForm.minMinutes}
                    value={editLatePickupForm.maxMinutes}
                    onChange={(e) => setEditLatePickupForm({ ...editLatePickupForm, maxMinutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền phạt (VNĐ)</label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={10000}
                  value={editLatePickupForm.penaltyAmount}
                  onChange={(e) => setEditLatePickupForm({ ...editLatePickupForm, penaltyAmount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-rose-600 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả quy tắc</label>
                <input
                  type="text"
                  value={editLatePickupForm.description}
                  onChange={(e) => setEditLatePickupForm({ ...editLatePickupForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditLatePickupModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
