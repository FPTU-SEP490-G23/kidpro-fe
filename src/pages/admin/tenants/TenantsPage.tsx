import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tenant, TENANT_MESSAGES } from '../../../types/tenant.types';
import { tenantApi } from '../../../api/tenantApi';
import { useToast } from '../../../contexts/ToastContext';
import CreateTenantModal from './components/CreateTenantModal';
import EditTenantModal from './components/EditTenantModal';
import DeactivateTenantModal from './components/DeactivateTenantModal';
import TenantDetailModal from './components/TenantDetailModal';
import {
  School,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Ban,
  RotateCcw,
  Building2,
  Phone,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
} from 'lucide-react';

export const TenantsPage: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Filter States
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [modalMode, setModalMode] = useState<'VIEW' | 'EDIT' | 'DEACTIVATE' | null>(null);

  // Debounce tìm kiếm 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // React Query Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenants', debouncedKeyword, statusFilter],
    queryFn: () =>
      tenantApi.getTenants({
        keyword: debouncedKeyword,
        status: statusFilter,
      }),
  });

  const tenants = data?.data || [];

  // Mở lại hoạt động trực tiếp khi trường đang tạm dừng
  const handleReactivate = async (tenant: Tenant) => {
    try {
      await tenantApi.changeTenantStatus(tenant.id, {
        status: 'ACTIVE',
      });
      toast.success('Mở lại hoạt động cơ sở trường học thành công.');
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    } catch {
      toast.error(TENANT_MESSAGES.MSG_004);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2.5">
            <School className="w-7 h-7 text-[#275A4E]" />
            <span>Quản lý Trường học & Multi-Tenant</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Khởi tạo phân vùng cơ sở mới, cấu hình gói bản quyền và kiểm soát hoạt động chi nhánh
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#275A4E] hover:bg-[#1E4D40] active:scale-[0.98] transition shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4 text-[#78C2AD]" />
          <span>Thêm Trường học Mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input (Debounced 300ms) */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên trường, mã trường, MST, hiệu trưởng..."
            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/30"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>

        {/* Dropdown Trạng thái */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Trạng thái:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/30"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="DEACTIVATED">Tạm dừng hoạt động</option>
            <option value="INACTIVE">Chưa kích hoạt</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Trường học</th>
                <th className="px-4 py-4">Mã trường (`school_code`)</th>
                <th className="px-4 py-4">Mã số thuế</th>
                <th className="px-4 py-4">Hotline</th>
                <th className="px-4 py-4">Đại diện / Hiệu trưởng</th>
                <th className="px-4 py-4">Gói dịch vụ</th>
                <th className="px-4 py-4">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="w-36 h-3.5 bg-slate-200 rounded-md" />
                          <div className="w-24 h-2.5 bg-slate-200 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><div className="w-20 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-4 py-4"><div className="w-20 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-4 py-4"><div className="w-20 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-4 py-4"><div className="w-28 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-4 py-4"><div className="w-16 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-4 py-4"><div className="w-20 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-5 py-4 text-right"><div className="w-16 h-4 bg-slate-200 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">
                      Không tìm thấy trường học nào phù hợp
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Thêm Trường học Mới&quot;
                    </p>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => {
                  const isActive = tenant.status === 'ACTIVE';
                  const isDeactivated = tenant.status === 'DEACTIVATED';

                  return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-slate-50/70 transition duration-150"
                    >
                      {/* Logo + Tên trường */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0">
                            {tenant.logoUrl ? (
                              <img
                                src={tenant.logoUrl}
                                alt={tenant.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <School className="w-5 h-5 text-slate-400 m-2.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{tenant.name}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{tenant.address}</p>
                          </div>
                        </div>
                      </td>

                      {/* Mã trường */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {tenant.schoolCode}
                        </span>
                      </td>

                      {/* Mã số thuế */}
                      <td className="px-4 py-4 font-mono font-medium text-slate-700">
                        {tenant.taxCode}
                      </td>

                      {/* Hotline */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tenant.hotline}</span>
                        </div>
                      </td>

                      {/* Đại diện / Hiệu trưởng */}
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">{tenant.adminName}</p>
                        <p className="text-[11px] text-slate-400">{tenant.adminEmail}</p>
                      </td>

                      {/* Gói dịch vụ */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tenant.subscriptionPackage === 'PREMIUM'
                              ? 'bg-amber-100 text-[#CF9127]'
                              : tenant.subscriptionPackage === 'STANDARD'
                              ? 'bg-emerald-100 text-[#275A4E]'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tenant.subscriptionPackage}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-[#275A4E] border border-emerald-200'
                              : isDeactivated
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isActive && <CheckCircle2 className="w-3 h-3 text-[#275A4E]" />}
                          {isDeactivated && <AlertOctagon className="w-3 h-3 text-rose-600" />}
                          {!isActive && !isDeactivated && <HelpCircle className="w-3 h-3 text-amber-600" />}
                          <span>
                            {isActive
                              ? 'Đang hoạt động'
                              : isDeactivated
                              ? 'Tạm dừng'
                              : 'Chưa kích hoạt'}
                          </span>
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setModalMode('VIEW');
                            }}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Chỉnh sửa */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setModalMode('EDIT');
                            }}
                            title="Chỉnh sửa thông tin"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Tạm dừng / Mở lại */}
                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setModalMode('DEACTIVATE');
                              }}
                              title="Tạm dừng hoạt động chi nhánh"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivate(tenant)}
                              title="Kích hoạt lại hoạt động"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition"
                            >
                              <RotateCcw className="w-4 h-4" />
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

      {/* Modal Khởi tạo Tenant mới */}
      <CreateTenantModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTenantCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
        }}
      />

      {/* Modal Chỉnh sửa Tenant */}
      {modalMode === 'EDIT' && (
        <EditTenantModal
          tenant={selectedTenant}
          isOpen={true}
          onClose={() => {
            setModalMode(null);
            setSelectedTenant(null);
          }}
          onTenantUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
          }}
        />
      )}

      {/* Modal Tạm dừng Tenant */}
      {modalMode === 'DEACTIVATE' && (
        <DeactivateTenantModal
          tenant={selectedTenant}
          isOpen={true}
          onClose={() => {
            setModalMode(null);
            setSelectedTenant(null);
          }}
          onStatusChanged={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
          }}
        />
      )}

      {/* Modal Chi tiết Tenant */}
      {modalMode === 'VIEW' && (
        <TenantDetailModal
          tenant={selectedTenant}
          isOpen={true}
          onClose={() => {
            setModalMode(null);
            setSelectedTenant(null);
          }}
        />
      )}
    </div>
  );
};

export default TenantsPage;
