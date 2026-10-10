import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserAccount } from '../../../types/rbac.types';
import { Tenant } from '../../../types/tenant.types';
import { rbacApi } from '../../../api/rbacApi';
import { tenantApi } from '../../../api/tenantApi';
import { getRoleDisplayName, getRoleBadgeColor } from '../../../utils/formatters';
import CreateUserModal from './components/CreateUserModal';
import PermissionsMatrixModal from './components/PermissionsMatrixModal';
import LockUserModal from './components/LockUserModal';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Lock,
  Unlock,
  SlidersHorizontal,
  Building2,
  Phone,
  CheckCircle2,
  AlertOctagon,
  User,
} from 'lucide-react';

export const RbacPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [tenantFilter, setTenantFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [modalMode, setModalMode] = useState<'PERMISSIONS' | 'LOCK' | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Fetch Tenants for dropdown
  const { data: tenantData } = useQuery({
    queryKey: ['admin-tenants-list'],
    queryFn: () => tenantApi.getTenants(),
  });
  const tenants: Tenant[] = tenantData?.data || [];

  // Fetch Users
  const { data: userData, isLoading } = useQuery({
    queryKey: [
      'admin-users-list',
      debouncedKeyword,
      tenantFilter,
      roleFilter,
      statusFilter,
    ],
    queryFn: () =>
      rbacApi.getUsers({
        keyword: debouncedKeyword,
        tenantId: tenantFilter,
        role: roleFilter,
        status: statusFilter,
      }),
  });

  const users: UserAccount[] = userData?.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-[#275A4E]" />
            <span>Cấu hình Phân quyền Vai trò RBAC</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản trị tài khoản nhân sự trường học, thiết lập ma trận quyền hạn 5 phân hệ và khóa tài khoản
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#275A4E] hover:bg-[#1E4D40] active:scale-[0.98] transition shadow-sm hover:shadow"
        >
          <UserPlus className="w-4 h-4 text-[#78C2AD]" />
          <span>Tạo Tài khoản Mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Tìm kiếm */}
        <div className="relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT..."
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/30"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Lọc theo Trường */}
        <div>
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/30"
          >
            <option value="ALL">Tất cả cơ sở trường</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc theo Vai trò */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/30"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="SYSTEM_ADMIN">{getRoleDisplayName('SYSTEM_ADMIN')}</option>
            <option value="BGH">{getRoleDisplayName('BGH')}</option>
            <option value="GIAO_VIEN">{getRoleDisplayName('GIAO_VIEN')}</option>
            <option value="GIAO_VU">{getRoleDisplayName('GIAO_VU')}</option>
            <option value="KE_TOAN">{getRoleDisplayName('KE_TOAN')}</option>
            <option value="BEP">{getRoleDisplayName('BEP')}</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/30"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Nhân sự & Tài khoản</th>
                <th className="px-4 py-4">Số điện thoại</th>
                <th className="px-4 py-4">Cơ sở trực thuộc</th>
                <th className="px-4 py-4">Vai trò RBAC</th>
                <th className="px-4 py-4">Số quyền hạn</th>
                <th className="px-4 py-4">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-3.5 bg-slate-200 rounded-md" />
                          <div className="w-24 h-2.5 bg-slate-200 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><div className="w-24 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-4 py-4"><div className="w-28 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-4 py-4"><div className="w-20 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-4 py-4"><div className="w-16 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-4 py-4"><div className="w-20 h-4 bg-slate-200 rounded-md" /></td>
                    <td className="px-5 py-4 text-right"><div className="w-20 h-4 bg-slate-200 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">
                      Không tìm thấy tài khoản nhân sự nào
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Thử điều chỉnh lại bộ lọc hoặc bấm &quot;Tạo Tài khoản Mới&quot;
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((usr) => {
                  const isActive = usr.status === 'ACTIVE';
                  const isSuperAdmin = usr.role === 'SYSTEM_ADMIN';

                  return (
                    <tr key={usr.id} className="hover:bg-slate-50/70 transition duration-150">
                      {/* Avatar + Họ tên + Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 overflow-hidden shrink-0">
                            {usr.avatarUrl ? (
                              <img
                                src={usr.avatarUrl}
                                alt={usr.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-slate-400 m-2" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{usr.fullName}</p>
                            <p className="text-[11px] text-slate-400">{usr.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Số điện thoại */}
                      <td className="px-4 py-4 font-mono font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{usr.phone}</span>
                        </div>
                      </td>

                      {/* Cơ sở */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{usr.tenantName}</span>
                        </div>
                      </td>

                      {/* Vai trò */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRoleBadgeColor(
                            usr.role
                          )}`}
                        >
                          {getRoleDisplayName(usr.role)}
                        </span>
                      </td>

                      {/* Số quyền hạn */}
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {usr.permissions.length} quyền
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-[#275A4E] border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="w-3 h-3 text-[#275A4E]" />
                          ) : (
                            <AlertOctagon className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{isActive ? 'Hoạt động' : 'Đã khóa'}</span>
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Phân quyền */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(usr);
                              setModalMode('PERMISSIONS');
                            }}
                            title="Cấu hình ma trận phân quyền"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#275A4E] bg-emerald-50 hover:bg-emerald-100 transition"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[#275A4E]" />
                            <span>Phân quyền</span>
                          </button>

                          {/* Nút Khóa / Mở khóa (Bảo vệ Super Admin) */}
                          {!isSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(usr);
                                setModalMode('LOCK');
                              }}
                              title={isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              className={`p-1.5 rounded-lg transition ${
                                isActive
                                  ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-700'
                                  : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800'
                              }`}
                            >
                              {isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          ) : (
                            <span
                              title="Tài khoản Quản trị viên cấp cao được bảo vệ an toàn"
                              className="p-1.5 text-slate-300 cursor-not-allowed"
                            >
                              <Lock className="w-4 h-4" />
                            </span>
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

      {/* Modal Thêm tài khoản mới */}
      <CreateUserModal
        isOpen={isCreateOpen}
        tenants={tenants}
        onClose={() => setIsCreateOpen(false)}
        onUserCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
        }}
      />

      {/* Modal Ma trận phân quyền */}
      {modalMode === 'PERMISSIONS' && (
        <PermissionsMatrixModal
          user={selectedUser}
          isOpen={true}
          onClose={() => {
            setModalMode(null);
            setSelectedUser(null);
          }}
          onPermissionsUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
          }}
        />
      )}

      {/* Modal Khóa / Mở khóa */}
      {modalMode === 'LOCK' && (
        <LockUserModal
          user={selectedUser}
          isOpen={true}
          onClose={() => {
            setModalMode(null);
            setSelectedUser(null);
          }}
          onStatusChanged={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
          }}
        />
      )}
    </div>
  );
};

export default RbacPage;
