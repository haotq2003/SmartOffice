'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import NotificationBell from '../../../components/NotificationBell';
import UserProfileHeader from '../../../components/UserProfileHeader';
import {
    Search,
    Shield,
    ShieldCheck,
    ShieldAlert,
    Building2,
    CreditCard,
    Users,
    UserCheck,
    UserX,
    Lock,
    KeyRound,
    Trash2,
    Edit3,
    Loader2,
    RefreshCw,
    X,
    CheckCircle2,
    AlertTriangle,
    Mail,
    Filter,
    ArrowUpDown,
    Check,
    Plus,
    ChevronLeft,
    ChevronRight,
    UserPlus
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { UserInfo } from '../../../store/authSlice';
import { useRouter } from 'next/navigation';

interface SystemUser {
    _id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'manager' | 'employee';
    rfidCardId?: string;
    tenantId?: {
        _id: string;
        name: string;
        domain: string;
        plan: string;
        status?: string;
    };
    violationCount?: number;
    bookingBannedUntil?: string | null;
    createdAt?: string;
}

export default function SuperAdminAllUsersPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [tenantsList, setTenantsList] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [selectedTenant, setSelectedTenant] = useState<string>('all');
    const [onlyViolations, setOnlyViolations] = useState(false);

    // Feedback Toast / Alert
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal: Edit User (Role & RFID)
    const [editModalUser, setEditModalUser] = useState<SystemUser | null>(null);
    const [editRole, setEditRole] = useState<'super_admin' | 'admin' | 'manager' | 'employee'>('employee');
    const [editRfid, setEditRfid] = useState('');
    const [editName, setEditName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Modal: Reset Password
    const [resetModalUser, setResetModalUser] = useState<SystemUser | null>(null);
    const [newPassword, setNewPassword] = useState('123456');
    const [isResetting, setIsResetting] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal: Create User
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createPassword, setCreatePassword] = useState('123456');
    const [createRole, setCreateRole] = useState<'super_admin' | 'admin' | 'manager' | 'employee'>('employee');
    const [createTenantId, setCreateTenantId] = useState('');
    const [createRfid, setCreateRfid] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Modal: Delete User
    const [deleteModalUser, setDeleteModalUser] = useState<SystemUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedRole, selectedTenant, onlyViolations]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setCurrentUser(parsed);
                if (parsed.role !== 'super_admin') {
                    router.push('/dashboard');
                    return;
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, tenantsRes] = await Promise.all([
                apiClient.get('/auth/system-users'),
                apiClient.get('/tenants').catch(() => ({ data: { success: false, data: [] } }))
            ]);

            if (usersRes.data?.success && Array.isArray(usersRes.data.data)) {
                setUsers(usersRes.data.data);
            }

            if (tenantsRes.data?.success && Array.isArray(tenantsRes.data.data)) {
                setTenantsList(tenantsRes.data.data.map((t: any) => ({ _id: t._id, name: t.name })));
            }
        } catch (error: any) {
            console.error('Error fetching system users:', error);
            showToast('error', error.response?.data?.message || 'Không thể tải danh sách tài khoản.');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    // Handle Edit User Submit
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModalUser) return;

        setIsUpdating(true);
        try {
            const res = await apiClient.patch(`/auth/system-users/${editModalUser._id}`, {
                name: editName,
                role: editRole,
                rfidCardId: editRfid
            });

            if (res.data?.success) {
                showToast('success', `Đã cập nhật tài khoản ${editModalUser.email} thành công!`);
                setEditModalUser(null);
                fetchAllData();
            }
        } catch (error: any) {
            showToast('error', error.response?.data?.message || 'Cập nhật thất bại.');
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle Clear Violations
    const handleClearViolations = async (userId: string, userEmail: string) => {
        try {
            const res = await apiClient.patch(`/auth/system-users/${userId}`, {
                clearViolations: true
            });
            if (res.data?.success) {
                showToast('success', `Đã xóa điểm phạt và mở khóa đặt lịch cho ${userEmail}.`);
                fetchAllData();
            }
        } catch (error: any) {
            showToast('error', error.response?.data?.message || 'Thao tác thất bại.');
        }
    };

    // Handle Reset Password Submit
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetModalUser) return;

        setIsResetting(true);
        try {
            const res = await apiClient.patch(`/auth/system-users/${resetModalUser._id}/reset-password`, {
                newPassword
            });

            if (res.data?.success) {
                showToast('success', res.data.message || 'Đặt lại mật khẩu thành công.');
                setResetModalUser(null);
            }
        } catch (error: any) {
            showToast('error', error.response?.data?.message || 'Đặt lại mật khẩu thất bại.');
        } finally {
            setIsResetting(false);
        }
    };

    // Handle Delete User Submit
    const handleDeleteUser = async () => {
        if (!deleteModalUser) return;

        setIsDeleting(true);
        try {
            const res = await apiClient.delete(`/auth/system-users/${deleteModalUser._id}`);
            if (res.data?.success) {
                showToast('success', res.data.message || 'Đã xóa tài khoản.');
                setDeleteModalUser(null);
                fetchAllData();
            }
        } catch (error: any) {
            showToast('error', error.response?.data?.message || 'Xóa tài khoản thất bại.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle Create User Submit
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (createRole !== 'super_admin' && !createTenantId) {
            showToast('error', 'Vui lòng chọn Doanh nghiệp trực thuộc cho tài khoản này.');
            return;
        }

        setIsCreating(true);
        try {
            const payload: any = {
                name: createName.trim(),
                email: createEmail.trim(),
                password: createPassword,
                role: createRole,
                rfidCardId: createRfid.trim() || undefined,
            };
            if (createRole !== 'super_admin') {
                payload.tenantId = createTenantId;
            }

            const res = await apiClient.post('/auth/system-users', payload);
            if (res.data?.success) {
                showToast('success', res.data.message || `Đã tạo tài khoản ${createEmail} thành công.`);
                setIsCreateModalOpen(false);
                setCreateName('');
                setCreateEmail('');
                setCreatePassword('123456');
                setCreateRole('employee');
                setCreateTenantId('');
                setCreateRfid('');
                fetchAllData();
            }
        } catch (error: any) {
            showToast('error', error.response?.data?.message || 'Tạo tài khoản thất bại.');
        } finally {
            setIsCreating(false);
        }
    };

    // Filtering logic
    const filteredUsers = users.filter((u) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            (u.rfidCardId && u.rfidCardId.toLowerCase().includes(query)) ||
            (u.tenantId?.name && u.tenantId.name.toLowerCase().includes(query));

        const matchesRole = selectedRole === 'all' || u.role === selectedRole;
        const matchesTenant = selectedTenant === 'all' || u.tenantId?._id === selectedTenant;
        const matchesViolation = !onlyViolations || (u.violationCount && u.violationCount > 0);

        return matchesSearch && matchesRole && matchesTenant && matchesViolation;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Counts
    const totalUsers = users.length;
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const managerCount = users.filter((u) => u.role === 'manager').length;
    const employeeCount = users.filter((u) => u.role === 'employee').length;
    const superAdminCount = users.filter((u) => u.role === 'super_admin').length;
    const violationCount = users.filter((u) => (u.violationCount || 0) > 0).length;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="super-admin-users" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo Tên, Email, Mã RFID, Doanh nghiệp..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-red-100 focus:ring-4 focus:ring-red-50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <button
                            onClick={fetchAllData}
                            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition cursor-pointer"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <NotificationBell />
                        <div className="h-8 w-px bg-gray-200"></div>
                        <UserProfileHeader user={currentUser} defaultRole="Super Admin" />
                    </div>
                </header>

                {/* Content */}
                <div className="p-8">
                    {/* Title */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold mb-2">
                                <ShieldCheck size={14} /> Platform Global Account Management
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Quản Lý Toàn Bộ Tài Khoản Hệ Thống</h1>
                            <p className="text-gray-500 text-xs">Xem, quản lý, đổi vai trò, cấp mã thẻ RFID và đặt lại mật khẩu cho tất cả tài khoản trên toàn nền tảng SmartOffice.</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md shadow-red-200 transition-all cursor-pointer active:scale-95"
                        >
                            <Plus size={18} />
                            <span>Thêm Tài Khoản Mới</span>
                        </button>
                    </div>

                    {/* Toast Alert */}
                    {toast && (
                        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
                            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                            <div className="flex items-center gap-2.5">
                                {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
                                <span>{toast.message}</span>
                            </div>
                            <button onClick={() => setToast(null)} className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer">Đóng</button>
                        </div>
                    )}

                    {/* Stats Summary Cards
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                                <Users size={22} />
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Tổng User Toàn Sàn</p>
                                <p className="text-2xl font-black text-gray-900">{totalUsers}</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Admin Doanh Nghiệp</p>
                                <p className="text-2xl font-black text-blue-600">{adminCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                <UserCheck size={22} />
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Quản Lý (Managers)</p>
                                <p className="text-2xl font-black text-purple-600">{managerCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <Users size={22} />
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Nhân Viên (Employees)</p>
                                <p className="text-2xl font-black text-emerald-600">{employeeCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Có Điểm Vi Phạm</p>
                                <p className="text-2xl font-black text-amber-600">{violationCount}</p>
                            </div>
                        </div>
                    </div> */}

                    {/* Filter Controls Bar */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        {/* Role Pills */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { id: 'all', label: `Tất cả (${totalUsers})` },
                                { id: 'super_admin', label: `Super Admin (${superAdminCount})` },
                                { id: 'admin', label: `Admin (${adminCount})` },
                                { id: 'manager', label: `Manager (${managerCount})` },
                                { id: 'employee', label: `Employee (${employeeCount})` }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedRole(tab.id)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                        selectedRole === tab.id
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Tenant Filter */}
                            <select
                                value={selectedTenant}
                                onChange={(e) => setSelectedTenant(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer focus:bg-white focus:border-red-600"
                            >
                                <option value="all">🏢 Tất cả Doanh nghiệp</option>
                                {tenantsList.map((t) => (
                                    <option key={t._id} value={t._id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>

                            {/* Violation Filter Toggle */}
                            <button
                                onClick={() => setOnlyViolations(!onlyViolations)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                    onlyViolations
                                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <AlertTriangle size={13} className={onlyViolations ? 'text-amber-700' : 'text-gray-400'} />
                                Chỉ xem tài khoản vi phạm
                            </button>
                        </div>
                    </div>

                    {/* Users Data Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-16 flex flex-col justify-center items-center text-gray-400 gap-3">
                                <Loader2 className="animate-spin text-red-600" size={32} />
                                <span className="text-sm font-medium">Đang tải toàn bộ dữ liệu tài khoản hệ thống...</span>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-16 text-center text-gray-400">
                                <UserX size={40} className="mx-auto text-gray-300 mb-2" />
                                <p className="font-semibold text-gray-700">Không tìm thấy tài khoản nào phù hợp.</p>
                                <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                                            <th className="py-4 px-6">Tài khoản & Họ tên</th>
                                            <th className="py-4 px-6">Email đăng nhập</th>
                                            <th className="py-4 px-6">Mã thẻ RFID</th>
                                            <th className="py-4 px-6">Doanh nghiệp</th>
                                            <th className="py-4 px-6">Vai trò</th>
                                            <th className="py-4 px-6">Vi phạm / Kỷ luật</th>
                                            <th className="py-4 px-6">Ngày tham gia</th>
                                            <th className="py-4 px-6 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {paginatedUsers.map((u) => {
                                            const isBanned = u.bookingBannedUntil && new Date(u.bookingBannedUntil) > new Date();
                                            const isSelf = currentUser?._id === u._id;

                                            return (
                                                <tr key={u._id} className="hover:bg-gray-50/60 transition-colors">
                                                    {/* User Name & Avatar */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs uppercase border ${
                                                                u.role === 'super_admin' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                u.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                u.role === 'manager' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            }`}>
                                                                {u.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-semibold text-gray-900">{u.name}</span>
                                                                    {isSelf && (
                                                                        <span className="px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 text-[10px] font-bold">Bạn</span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-gray-400 font-mono">ID: {u._id.slice(-6)}</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Email */}
                                                    <td className="py-4 px-6 text-gray-700 font-medium text-xs">
                                                        {u.email}
                                                    </td>

                                                    {/* RFID Card */}
                                                    <td className="py-4 px-6 font-mono text-xs">
                                                        {u.rfidCardId ? (
                                                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold inline-flex items-center gap-1 shadow-2xs">
                                                                <CreditCard size={12} className="text-blue-600" />
                                                                {u.rfidCardId}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-xs">Chưa cấp thẻ</span>
                                                        )}
                                                    </td>

                                                    {/* Tenant / Company */}
                                                    <td className="py-4 px-6">
                                                        {u.role === 'super_admin' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200/70 text-red-700 font-bold text-xs">
                                                                <Shield size={12} /> Hệ thống SmartOffice
                                                            </span>
                                                        ) : u.tenantId ? (
                                                            <div>
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-800 font-bold text-xs">
                                                                    <Building2 size={12} className="text-blue-600" />
                                                                    {u.tenantId.name}
                                                                </span>
                                                                <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-semibold">Gói: {u.tenantId.plan}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-xs">Chưa gán công ty</span>
                                                        )}
                                                    </td>

                                                    {/* Role Badge */}
                                                    <td className="py-4 px-6">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-block ${
                                                            u.role === 'super_admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                            u.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                            u.role === 'manager' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        }`}>
                                                            {u.role === 'super_admin' ? 'Super Admin' :
                                                             u.role === 'admin' ? 'Tenant Admin' :
                                                             u.role === 'manager' ? 'Manager' : 'Employee'}
                                                        </span>
                                                    </td>

                                                    {/* Violations / Ban */}
                                                    <td className="py-4 px-6 text-xs">
                                                        {isBanned ? (
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] uppercase border border-rose-200">
                                                                    🚫 Tạm cấm đặt lịch
                                                                </span>
                                                                <button
                                                                    onClick={() => handleClearViolations(u._id, u.email)}
                                                                    className="text-[10px] text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                                                                >
                                                                    Gỡ cấm ngay
                                                                </button>
                                                            </div>
                                                        ) : (u.violationCount || 0) > 0 ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
                                                                    ⚠️ {u.violationCount} vi phạm
                                                                </span>
                                                                <button
                                                                    onClick={() => handleClearViolations(u._id, u.email)}
                                                                    className="text-[10px] text-gray-500 hover:text-blue-600 underline cursor-pointer"
                                                                    title="Xóa điểm vi phạm"
                                                                >
                                                                    Xóa điểm
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 font-medium">Bình thường</span>
                                                        )}
                                                    </td>

                                                    {/* Created Date */}
                                                    <td className="py-4 px-6 text-gray-500 text-xs">
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Edit user button */}
                                                            <button
                                                                onClick={() => {
                                                                    setEditModalUser(u);
                                                                    setEditName(u.name);
                                                                    setEditRole(u.role);
                                                                    setEditRfid(u.rfidCardId || '');
                                                                }}
                                                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition cursor-pointer"
                                                                title="Chỉnh sửa tài khoản"
                                                            >
                                                                <Edit3 size={14} />
                                                            </button>

                                                            {/* Reset password button */}
                                                            <button
                                                                onClick={() => {
                                                                    setResetModalUser(u);
                                                                    setNewPassword('123456');
                                                                }}
                                                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition cursor-pointer"
                                                                title="Đặt lại mật khẩu"
                                                            >
                                                                <KeyRound size={14} />
                                                            </button>

                                                            {/* Delete user button */}
                                                            {!isSelf && (
                                                                <button
                                                                    onClick={() => setDeleteModalUser(u)}
                                                                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition cursor-pointer"
                                                                    title="Xóa tài khoản khỏi hệ thống"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {filteredUsers.length > 0 && (
                                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>Hiển thị</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="bg-white border border-gray-200 text-gray-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-red-500 cursor-pointer font-medium"
                                        >
                                            <option value={5}>5 / trang</option>
                                            <option value={10}>10 / trang</option>
                                            <option value={20}>20 / trang</option>
                                            <option value={50}>50 / trang</option>
                                        </select>
                                        <span>
                                            Từ <strong className="text-gray-800">{(currentPage - 1) * pageSize + 1}</strong> đến{' '}
                                            <strong className="text-gray-800">{Math.min(currentPage * pageSize, filteredUsers.length)}</strong> trên tổng số{' '}
                                            <strong className="text-gray-800">{filteredUsers.length}</strong> tài khoản
                                        </span>
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-xs flex items-center gap-1 px-2.5 font-medium"
                                            >
                                                <ChevronLeft size={14} /> Trước
                                            </button>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                                .map((page, idx, arr) => {
                                                    const prev = arr[idx - 1];
                                                    return (
                                                        <React.Fragment key={page}>
                                                            {prev && page - prev > 1 && (
                                                                <span className="px-1 text-gray-400 text-xs">...</span>
                                                            )}
                                                            <button
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                                    currentPage === page
                                                                        ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                                                                        : 'text-gray-700 hover:bg-white border border-transparent hover:border-gray-200'
                                                                }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        </React.Fragment>
                                                    );
                                                })}

                                            <button
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-xs flex items-center gap-1 px-2.5 font-medium"
                                            >
                                                Sau <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    </div>
                </div>
            </main>

            {/* Modal: Create User */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 my-8">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                                <UserPlus size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base">Thêm Tài Khoản Mới Vào Hệ Thống</h3>
                                <p className="text-xs text-gray-500">Cấp tài khoản mới cho doanh nghiệp hoặc tài khoản quản trị sàn</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nguyễn Văn A"
                                        value={createName}
                                        onChange={(e) => setCreateName(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-red-600 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Email đăng nhập <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="user@company.com"
                                        value={createEmail}
                                        onChange={(e) => setCreateEmail(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-red-600 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Mật khẩu khởi tạo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={createPassword}
                                    onChange={(e) => setCreatePassword(e.target.value)}
                                    placeholder="Tối thiểu 6 ký tự"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-red-600 outline-none transition-all"
                                    required
                                />
                                <p className="text-[11px] text-gray-400 mt-1">Mặc định: 123456</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Vai trò hệ thống <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { val: 'employee', label: 'Employee', desc: 'Nhân viên công ty' },
                                        { val: 'manager', label: 'Manager', desc: 'Quản lý thiết bị / xe' },
                                        { val: 'admin', label: 'Tenant Admin', desc: 'Quản trị doanh nghiệp' },
                                        { val: 'super_admin', label: 'Super Admin', desc: 'Toàn quyền hệ thống' },
                                    ].map((r) => (
                                        <button
                                            key={r.val}
                                            type="button"
                                            onClick={() => setCreateRole(r.val as any)}
                                            className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-center ${
                                                createRole === r.val
                                                    ? 'border-red-600 bg-red-50/50 text-red-900 font-bold ring-2 ring-red-100'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                        >
                                            <span className="font-bold">{r.label}</span>
                                            <span className="text-[10px] text-gray-400 font-normal">{r.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {createRole !== 'super_admin' ? (
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
                                        Doanh nghiệp trực thuộc <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={createTenantId}
                                        onChange={(e) => setCreateTenantId(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-red-600 outline-none transition-all cursor-pointer"
                                        required
                                    >
                                        <option value="">-- Chọn công ty / doanh nghiệp --</option>
                                        {tenantsList.map((t) => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                                    <span>Tài khoản Super Admin có quyền quản trị toàn bộ nền tảng, không thuộc công ty riêng lẻ nào.</span>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Mã thẻ từ RFID (Tùy chọn)</label>
                                <input
                                    type="text"
                                    value={createRfid}
                                    onChange={(e) => setCreateRfid(e.target.value.toUpperCase())}
                                    placeholder="Ví dụ: RFID-8899 (Để trống hệ thống sẽ tự sinh ngẫu nhiên)"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-red-600 outline-none transition-all uppercase placeholder:normal-case font-mono"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-red-200 disabled:opacity-50"
                                >
                                    {isCreating && <Loader2 className="animate-spin" size={14} />}
                                    Tạo Tài Khoản
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit User (Role & RFID) */}
            {editModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setEditModalUser(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Edit3 size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base">Cập Nhật Thông Tin Tài Khoản</h3>
                                <p className="text-xs text-gray-500">{editModalUser.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Họ và tên</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Mã thẻ RFID Smart Lock</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: RFID-1005"
                                        value={editRfid}
                                        onChange={(e) => setEditRfid(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Phân quyền Vai trò (Role)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'employee', label: 'Employee', desc: 'Nhân viên đặt lịch' },
                                        { id: 'manager', label: 'Manager', desc: 'Quản lý phê duyệt' },
                                        { id: 'admin', label: 'Tenant Admin', desc: 'Quản trị công ty' },
                                        { id: 'super_admin', label: 'Super Admin', desc: 'Quản trị nền tảng' }
                                    ].map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setEditRole(r.id as any)}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                                editRole === r.id
                                                    ? 'bg-blue-50 border-blue-600 text-blue-900'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <p className="font-bold text-xs">{r.label}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{r.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditModalUser(null)}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                                >
                                    {isUpdating && <Loader2 className="animate-spin" size={14} />}
                                    Lưu Thay Đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Reset Password */}
            {resetModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setResetModalUser(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                <KeyRound size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base">Đặt Lại Mật Khẩu</h3>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{resetModalUser.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Mật khẩu mới (Tối thiểu 6 ký tự)</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-amber-600 outline-none transition-all font-mono"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">Mặc định: 123456</p>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setResetModalUser(null)}
                                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isResetting}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                                >
                                    {isResetting && <Loader2 className="animate-spin" size={14} />}
                                    Xác Nhận Đổi Mật Khẩu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Confirm Delete User */}
            {deleteModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base mb-1">Xác Nhận Xóa Tài Khoản?</h3>
                        <p className="text-xs text-gray-500 mb-6">
                            Bạn có chắc chắn muốn xóa tài khoản <span className="font-bold text-gray-800">{deleteModalUser.email}</span> ({deleteModalUser.name}) khỏi hệ thống? Thao tác này không thể hoàn tác.
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteModalUser(null)}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                Hủy Bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteUser}
                                disabled={isDeleting}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-red-200 disabled:opacity-50"
                            >
                                {isDeleting && <Loader2 className="animate-spin" size={14} />}
                                Xóa Vĩnh Viễn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
