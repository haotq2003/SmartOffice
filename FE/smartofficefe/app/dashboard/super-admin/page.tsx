'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { Search, Building2, CreditCard, DollarSign, Users, ShieldCheck, Loader2, LogOut, CheckCircle2, TrendingUp } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

interface TenantData {
    _id: string;
    name: string;
    domain: string;
    plan: 'free' | 'premium' | 'enterprise';
    totalUsers?: number;
    createdAt?: string;
}

export default function SuperAdminDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [tenants, setTenants] = useState<TenantData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingTenantId, setUpdatingTenantId] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/tenants');
            if (res.data && res.data.success && Array.isArray(res.data.data)) {
                setTenants(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching tenants:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePlan = async (tenantId: string, newPlan: 'free' | 'premium' | 'enterprise') => {
        setUpdatingTenantId(tenantId);
        setStatusMsg(null);
        try {
            const res = await apiClient.patch(`/tenants/${tenantId}/plan`, { plan: newPlan });
            if (res.data && res.data.success) {
                setStatusMsg(`Đã cập nhật gói dịch vụ thành ${newPlan.toUpperCase()} thành công!`);
                fetchTenants();
            }
        } catch (err: any) {
            console.error(err);
            setStatusMsg('Cập nhật gói thất bại.');
        } finally {
            setUpdatingTenantId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.domain.toLowerCase().includes(searchQuery.toLowerCase()));

    const totalUsersSum = tenants.reduce((acc, curr) => acc + (curr.totalUsers || 0), 0);
    const premiumCount = tenants.filter(t => t.plan === 'premium').length;
    const enterpriseCount = tenants.filter(t => t.plan === 'enterprise').length;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="dashboard" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm doanh nghiệp thuê theo tên hoặc domain..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <NotificationBell />
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{user?.name || 'Super Admin'}</p>
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Platform Super Admin</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-md shadow-red-100">
                                SA
                            </div>
                            <button
                                onClick={handleLogout}
                                title="Đăng xuất"
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1 cursor-pointer"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Bảng Điều Khiển Super Admin SaaS</h1>
                        <p className="text-gray-500 text-sm">Quản lý doanh nghiệp thuê, hợp đồng và doanh thu trên toàn nền tảng SmartOffice.</p>
                    </div>

                    {statusMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium">
                            {statusMsg}
                        </div>
                    )}

                    {/* Stats overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Doanh nghiệp thuê</p>
                                <p className="text-2xl font-extrabold text-gray-900">{tenants.length}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng User Toàn Sàn</p>
                                <p className="text-2xl font-extrabold text-gray-900">{totalUsersSum}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Gói Premium / Enterprise</p>
                                <p className="text-2xl font-extrabold text-gray-900">{premiumCount + enterpriseCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Doanh thu ước tính</p>
                                <p className="text-2xl font-extrabold text-gray-900">${(premiumCount * 49 + enterpriseCount * 199).toLocaleString()}/tháng</p>
                            </div>
                        </div>
                    </div>

                    {/* Tenant List Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Danh sách Doanh Nghiệp Thuê Ứng Dụng</h3>
                                <p className="text-xs text-gray-400">Danh sách các công ty đang hoạt động trên hệ thống SmartOffice.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                                <Loader2 className="animate-spin" size={24} />
                                <span>Đang tải danh sách doanh nghiệp...</span>
                            </div>
                        ) : filteredTenants.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                Chưa có doanh nghiệp nào phù hợp.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                                        <th className="py-4 px-6">Tên Doanh nghiệp</th>
                                        <th className="py-4 px-6">Domain / Tên miền</th>
                                        <th className="py-4 px-6">Số lượng User</th>
                                        <th className="py-4 px-6">Gói dịch vụ</th>
                                        <th className="py-4 px-6">Hành động Nâng gói</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {filteredTenants.map((tenant) => {
                                        const isUpdating = updatingTenantId === tenant._id;

                                        return (
                                            <tr key={tenant._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6 font-bold text-gray-900">
                                                    {tenant.name}
                                                </td>
                                                <td className="py-4 px-6 text-gray-600 text-xs font-mono">
                                                    {tenant.domain}.smartoffice.com
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-blue-600">
                                                    {tenant.totalUsers || 1} users
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${tenant.plan === 'enterprise'
                                                                ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                                : tenant.plan === 'premium'
                                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                            }`}
                                                    >
                                                        {tenant.plan}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdatePlan(tenant._id, 'free')}
                                                            disabled={isUpdating || tenant.plan === 'free'}
                                                            className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-30 cursor-pointer"
                                                        >
                                                            Free
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdatePlan(tenant._id, 'premium')}
                                                            disabled={isUpdating || tenant.plan === 'premium'}
                                                            className="px-2.5 py-1 text-xs border border-blue-200 rounded-lg hover:bg-blue-50 text-blue-600 font-bold disabled:opacity-30 cursor-pointer"
                                                        >
                                                            Premium
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdatePlan(tenant._id, 'enterprise')}
                                                            disabled={isUpdating || tenant.plan === 'enterprise'}
                                                            className="px-2.5 py-1 text-xs border border-purple-200 rounded-lg hover:bg-purple-50 text-purple-600 font-bold disabled:opacity-30 cursor-pointer"
                                                        >
                                                            Enterprise
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
