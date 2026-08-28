'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { 
    Search, 
    Building2, 
    CreditCard, 
    DollarSign, 
    Users, 
    ShieldCheck, 
    Loader2, 
    LogOut, 
    CheckCircle2, 
    TrendingUp, 
    Plus, 
    Lock, 
    Unlock, 
    Sparkles, 
    Download,
    KeyRound,
    X,
    Server,
    Check,
    AlertCircle
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

interface TenantData {
    _id: string;
    name: string;
    domain: string;
    plan: string;
    planName?: string;
    status: 'active' | 'suspended';
    totalUsers: number;
    totalResources: number;
    monthlyRevenue: number;
    createdAt: string;
}

export default function SuperAdminDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [tenants, setTenants] = useState<TenantData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'premium' | 'enterprise'>('all');
    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    // Modal state for manual enterprise onboarding
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTenantName, setNewTenantName] = useState('');
    const [newDomain, setNewDomain] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newPlan, setNewPlan] = useState<'free' | 'premium' | 'enterprise'>('premium');
    const [isSubmittingNew, setIsSubmittingNew] = useState(false);

    const [analytics, setAnalytics] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);

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
            const [tenantsRes, revenueRes, transRes] = await Promise.all([
                apiClient.get('/tenants').catch(() => ({ data: { success: false, data: [] } })),
                apiClient.get('/tenants/analytics/revenue').catch(() => ({ data: { success: false, data: null } })),
                apiClient.get('/payment/transactions').catch(() => ({ data: { success: false, data: [] } }))
            ]);

            if (tenantsRes.data && tenantsRes.data.success && Array.isArray(tenantsRes.data.data)) {
                const merged = tenantsRes.data.data.map((t: any, idx: number) => ({
                    _id: t._id || `api-${idx}`,
                    name: t.name || 'Doanh nghiệp',
                    domain: t.domain || 'domain',
                    plan: t.plan || 'free',
                    planName: t.planDetails?.name || (t.plan === 'enterprise' ? 'Gói Tập Đoàn (Enterprise)' : t.plan === 'premium' ? 'Gói Chuyên Nghiệp (Premium)' : 'Gói Trải Nghiệm (Free)'),
                    status: t.status || 'active',
                    totalUsers: t.totalUsers || 1,
                    totalResources: 5,
                    monthlyRevenue: t.monthlyRevenue !== undefined ? t.monthlyRevenue : (t.planDetails ? t.planDetails.price : (t.plan === 'enterprise' ? 199 : t.plan === 'premium' ? 49 : 0)),
                    createdAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '2026-03-01'
                }));
                setTenants(merged);
            } else {
                setTenants([]);
            }

            if (revenueRes.data && revenueRes.data.success && revenueRes.data.data) {
                setAnalytics(revenueRes.data.data);
            }

            if (transRes.data && transRes.data.success && Array.isArray(transRes.data.data)) {
                setTransactions(transRes.data.data);
            }
        } catch (err) {
            console.warn('API /tenants error or offline:', err);
            setTenants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = (tenantId: string) => {
        setTenants(prev => prev.map(t => {
            if (t._id === tenantId) {
                const nextStatus = t.status === 'active' ? 'suspended' : 'active';
                setStatusMsg(`Đã ${nextStatus === 'active' ? 'mở khóa' : 'tạm dừng'} hoạt động doanh nghiệp ${t.name}!`);
                return { ...t, status: nextStatus };
            }
            return t;
        }));
    };

    const handleCreateTenant = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTenantName || !newDomain) return;

        setIsSubmittingNew(true);
        setTimeout(() => {
            const created: TenantData = {
                _id: `tenant-${Date.now()}`,
                name: newTenantName,
                domain: newDomain.toLowerCase().replace(/\s+/g, '-'),
                plan: newPlan,
                planName: newPlan === 'enterprise' ? 'Gói Tập Đoàn (Enterprise)' : newPlan === 'premium' ? 'Gói Chuyên Nghiệp (Premium)' : 'Gói Trải Nghiệm (Free)',
                status: 'active',
                totalUsers: 1,
                totalResources: 5,
                monthlyRevenue: newPlan === 'enterprise' ? 199 : newPlan === 'premium' ? 49 : 0,
                createdAt: new Date().toISOString().split('T')[0]
            };

            setTenants(prev => [created, ...prev]);
            setStatusMsg(`Đã tạo thành công doanh nghiệp mới: ${newTenantName} (${newDomain}.smartoffice.com)`);
            setIsAddModalOpen(false);
            setNewTenantName('');
            setNewDomain('');
            setNewAdminName('');
            setNewAdminEmail('');
            setIsSubmittingNew(false);
        }, 500);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const filteredTenants = tenants.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.domain.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterPlan === 'all' || t.plan === filterPlan;
        return matchesSearch && matchesFilter;
    });

    const totalUsersSum = analytics ? analytics.totalUsers : tenants.reduce((acc, curr) => acc + (curr.totalUsers || 0), 0);
    const totalRevenueSum = analytics ? analytics.mrrUSD : tenants.reduce((acc, curr) => acc + (curr.monthlyRevenue || 0), 0);
    const paidCount = tenants.filter(t => t.plan !== 'free').length;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="dashboard" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm doanh nghiệp thuê theo tên hoặc subdomain..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-red-100 focus:ring-4 focus:ring-red-50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <NotificationBell />
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{user?.name || 'Platform Super Admin'}</p>
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Master Platform Owner</p>
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
                    {/* Title & Quick Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold mb-2">
                                <ShieldCheck size={14} /> SaaS Multi-Tenant Control Hub
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Quản Lý Nền Tảng Doanh Nghiệp (Platform SaaS)</h1>
                            <p className="text-gray-500 text-xs">Quản lý doanh nghiệp thuê, hợp đồng gói cước, số lượng user và doanh thu toàn hệ thống.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/door-simulator')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                                <KeyRound size={16} className="text-amber-500" /> Mô Phỏng Quẹt Cửa
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-100 cursor-pointer"
                            >
                                <Plus size={16} /> Thêm Doanh Nghiệp Mới
                            </button>
                        </div>
                    </div>

                    {statusMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium flex justify-between items-center shadow-sm">
                            <span>{statusMsg}</span>
                            <button onClick={() => setStatusMsg(null)} className="text-xs font-bold opacity-60 hover:opacity-100">Đóng</button>
                        </div>
                    )}

                    {/* Stats Overview Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Doanh Nghiệp Thuê</span>
                                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                    <Building2 size={20} />
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{tenants.length} công ty</h3>
                                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <TrendingUp size={14} /> +2 công ty <span className="text-gray-400 font-normal">tháng này</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng User Toàn Sàn</span>
                                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                    <Users size={20} />
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{totalUsersSum.toLocaleString()} users</h3>
                                <p className="text-xs text-gray-400">Tài khoản Admin, Manager & Employee</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Doanh Thu Định Kỳ MRR</span>
                                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                    <DollarSign size={20} />
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-extrabold text-emerald-600 mb-1">${totalRevenueSum.toLocaleString()} <span className="text-xs font-normal text-gray-400">/ tháng</span></h3>
                                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <TrendingUp size={14} /> +18.2% <span className="text-gray-400 font-normal">ARR ước tính</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Gói Trả Phí (Paid Rate)</span>
                                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                    <CreditCard size={20} />
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{paidCount}/{tenants.length} <span className="text-xs font-normal text-gray-400">({Math.round((paidCount / (tenants.length || 1)) * 100)}%)</span></h3>
                                <p className="text-xs text-gray-400">Chuyển đổi Premium & Enterprise</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs & Search */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="flex gap-2">
                            {[
                                { label: 'Tất cả Doanh Nghiệp', value: 'all' },
                                { label: 'Gói Free', value: 'free' },
                                { label: 'Gói Premium', value: 'premium' },
                                { label: 'Gói Enterprise', value: 'enterprise' },
                            ].map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setFilterPlan(tab.value as any)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                        filterPlan === tab.value
                                            ? 'bg-red-600 text-white shadow-md shadow-red-100'
                                            : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <span className="text-xs font-semibold text-gray-400">Hiển thị {filteredTenants.length} / {tenants.length} công ty</span>
                    </div>

                    {/* Tenants Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                        {filteredTenants.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                Không tìm thấy doanh nghiệp nào phù hợp.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[850px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                                            <th className="py-4 px-6">Doanh Nghiệp Thuê</th>
                                            <th className="py-4 px-6">Subdomain</th>
                                            <th className="py-4 px-6 text-center">Nhân Sự (Users)</th>
                                            <th className="py-4 px-6">Gói Dịch Vụ Đang Dùng</th>
                                            <th className="py-4 px-6 text-right">Trạng Thái & Khóa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {filteredTenants.map((tenant) => {
                                            const isSuspended = tenant.status === 'suspended';

                                            return (
                                                <tr key={tenant._id} className={`hover:bg-gray-50/70 transition-colors ${isSuspended ? 'bg-rose-50/30' : ''}`}>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase ${
                                                                tenant.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                                                                tenant.plan === 'premium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {tenant.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-sm">{tenant.name}</h4>
                                                                <span className="text-[11px] text-gray-400">Tham gia: {tenant.createdAt}</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-4 px-6 font-mono text-xs font-bold text-gray-600">
                                                        {tenant.domain}.smartoffice.com
                                                    </td>

                                                    <td className="py-4 px-6 text-center font-extrabold text-blue-600">
                                                        {tenant.totalUsers} <span className="text-gray-400 font-normal text-xs">users</span>
                                                    </td>

                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                                                                {tenant.plan === 'enterprise' && <Sparkles size={14} className="text-purple-600" />}
                                                                {tenant.planName || tenant.plan}
                                                            </span>
                                                            <span className="text-xs font-semibold text-blue-600 mt-0.5">
                                                                ${tenant.monthlyRevenue}/tháng <span className="text-gray-400 font-normal">({tenant.plan.toUpperCase()})</span>
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                                tenant.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-100 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                {tenant.status === 'active' ? '● Đang hoạt động' : '🔒 Đã tạm khóa'}
                                                            </span>

                                                            <button
                                                                onClick={() => handleToggleStatus(tenant._id)}
                                                                title={isSuspended ? 'Mở khóa hoạt động' : 'Tạm khóa công ty'}
                                                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                                                    isSuspended 
                                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
                                                                        : 'bg-white border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                                                }`}
                                                            >
                                                                {isSuspended ? <Unlock size={16} /> : <Lock size={16} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Real-time Payment Transactions Table (Top 3 Recent) */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-extrabold text-gray-900">Giao Dịch Nạp Tiền / Thanh Toán Gần Đây (3 Mới Nhất)</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-pink-100 text-pink-700">Audit Log</span>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/revenue')}
                            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            Xem Tất Cả Doanh Thu & Lịch Sử ({transactions.length}) →
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Chưa có giao dịch thanh toán nào được ghi nhận trên MongoDB.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[850px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                                            <th className="py-4 px-6">Mã Giao Dịch (Ref)</th>
                                            <th className="py-4 px-6">Doanh Nghiệp Thanh Toán</th>
                                            <th className="py-4 px-6">Gói Đăng Ký</th>
                                            <th className="py-4 px-6 text-right">Giá Trị (VND / USD)</th>
                                            <th className="py-4 px-6 text-center">Cổng Thanh Toán</th>
                                            <th className="py-4 px-6 text-right">Thời Gian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {transactions.slice(0, 3).map((tx) => (
                                            <tr key={tx._id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="py-4 px-6 font-mono text-xs font-bold text-gray-800">
                                                    {tx.transactionRef || tx._id}
                                                </td>
                                                <td className="py-4 px-6 font-bold text-gray-900">
                                                    {tx.tenantId?.name || 'Doanh nghiệp'}
                                                    <span className="block text-[11px] text-gray-400 font-normal">{tx.tenantId?.domain ? `${tx.tenantId.domain}.smartoffice.com` : ''}</span>
                                                </td>
                                                <td className="py-4 px-6 font-extrabold uppercase text-xs text-purple-700">
                                                    {tx.planCode}
                                                </td>
                                                <td className="py-4 px-6 text-right font-extrabold text-emerald-600">
                                                    {tx.amountVND ? tx.amountVND.toLocaleString('vi-VN') : '0'} VNĐ
                                                    <span className="block text-xs font-normal text-gray-400">(${tx.amountUSD})</span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-pink-50 text-pink-600 border border-pink-100">
                                                        {tx.paymentMethod?.toUpperCase() || 'MOMO'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right text-xs text-gray-500 font-medium">
                                                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : 'Mới đây'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal: Manual Enterprise Onboarding */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-red-50 text-red-600">
                                        <Building2 size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">Khởi Tạo Doanh Nghiệp Mới</h3>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTenant} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Tên Công Ty / Doanh Nghiệp</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Tập đoàn Công nghệ VNG"
                                        value={newTenantName}
                                        onChange={(e) => setNewTenantName(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-red-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Tên Miền Subdomain</label>
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus-within:bg-white focus-within:border-red-500">
                                        <input
                                            type="text"
                                            required
                                            placeholder="vng-tech"
                                            value={newDomain}
                                            onChange={(e) => setNewDomain(e.target.value)}
                                            className="w-full bg-transparent outline-none text-sm"
                                        />
                                        <span className="text-xs font-bold text-gray-400 shrink-0">.smartoffice.com</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Tên Admin Ban Đầu</label>
                                        <input
                                            type="text"
                                            placeholder="Nguyễn Văn A"
                                            value={newAdminName}
                                            onChange={(e) => setNewAdminName(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-red-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Gói Cước Ban Đầu</label>
                                        <select
                                            value={newPlan}
                                            onChange={(e) => setNewPlan(e.target.value as any)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-red-500 outline-none font-bold"
                                        >
                                            <option value="free">Free ($0)</option>
                                            <option value="premium">Premium ($49)</option>
                                            <option value="enterprise">Enterprise ($199)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingNew}
                                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-100 disabled:opacity-50"
                                    >
                                        {isSubmittingNew ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                                        Khởi Tạo Ngay
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
