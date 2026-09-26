'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import UserProfileHeader from '../../components/UserProfileHeader';
import { 
    DollarSign, 
    TrendingUp, 
    CreditCard, 
    Building2, 
    Calendar, 
    Search, 
    Filter, 
    Download, 
    Loader2, 
    LogOut, 
    ArrowUpRight, 
    CheckCircle2, 
    Clock, 
    XCircle,
    BarChart3,
    PieChart,
    Sparkles,
    Shield,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

interface TransactionItem {
    _id: string;
    tenantId?: {
        _id: string;
        name: string;
        domain: string;
        plan: string;
    };
    planCode: string;
    amountUSD: number;
    amountVND: number;
    months?: number;
    paymentMethod: string;
    transactionRef: string;
    status: 'success' | 'pending' | 'failed';
    createdAt: string;
}

interface SummaryData {
    totalVND: number;
    totalUSD: number;
}

export default function PlatformRevenuePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Data states
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [summary, setSummary] = useState<SummaryData>({ totalVND: 0, totalUSD: 0 });
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Analytics summary from tenants
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
        fetchRevenueAnalytics();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [page, searchQuery, statusFilter, methodFilter]);

    const fetchRevenueAnalytics = async () => {
        try {
            const res = await apiClient.get('/tenants/analytics/revenue');
            if (res.data && res.data.success) {
                setAnalytics(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching revenue analytics:', err);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params: any = { page, limit };
            if (searchQuery) params.search = searchQuery;
            if (statusFilter) params.status = statusFilter;
            if (methodFilter) params.paymentMethod = methodFilter;

            const res = await apiClient.get('/payment/transactions', { params });
            if (res.data && res.data.success) {
                setTransactions(res.data.data || []);
                setTotalItems(res.data.total || 0);
                setTotalPages(res.data.totalPages || 1);
                if (res.data.summary) {
                    setSummary(res.data.summary);
                }
            } else {
                setTransactions([]);
            }
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    // Calculate this month revenue from successful transactions in current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthTransactions = transactions.filter(t => {
        if (t.status !== 'success' || !t.createdAt) return false;
        const d = new Date(t.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const thisMonthVND = thisMonthTransactions.reduce((acc, curr) => acc + (curr.amountVND || 0), 0);
    const thisMonthUSD = thisMonthTransactions.reduce((acc, curr) => acc + (curr.amountUSD || 0), 0);

    const formatCurrencyVND = (amount: number) => {
        return amount.toLocaleString('vi-VN') + ' VNĐ';
    };

    const formatCurrencyUSD = (amount: number) => {
        return '$' + amount.toLocaleString('en-US');
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="revenue" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã giao dịch hoặc mã gói..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <NotificationBell />
                        <div className="h-8 w-px bg-gray-200"></div>
                        <UserProfileHeader user={user} defaultRole="Super Admin" />
                    </div>
                </header>

                {/* Content */}
                <div className="p-8">
                    {/* Title & Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-2">
                                <DollarSign size={14} /> Revenue Analytics & Audit Ledger
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Thống Kê Doanh Thu Platform</h1>
                            <p className="text-gray-500 text-xs">Theo dõi chi tiết doanh thu nạp tiền, MRR/ARR và toàn bộ lịch sử thanh toán toàn hệ thống SmartOffice.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchTransactions()}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                                <RefreshCw size={15} /> Làm Mới
                            </button>
                        </div>
                    </div>

                    {/* Metric Summary Cards (4 Cards Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Card 1: Doanh Thu Tháng Này */}
                        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Doanh Thu Tháng Này</span>
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-emerald-600 mb-1">
                                {formatCurrencyVND(thisMonthVND > 0 ? thisMonthVND : (summary.totalVND || 0))}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                                <span>Tương đương USD:</span>
                                <span className="font-bold text-gray-900">{formatCurrencyUSD(thisMonthUSD > 0 ? thisMonthUSD : (summary.totalUSD || 0))}</span>
                            </div>
                        </div>

                        {/* Card 2: Tổng Doanh Thu Tích Lũy */}
                        <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng Doanh Thu Tích Lũy</span>
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-blue-600 mb-1">
                                {formatCurrencyVND(summary.totalVND || 0)}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                                <span>Tích lũy USD toàn sàn:</span>
                                <span className="font-bold text-gray-900">{formatCurrencyUSD(summary.totalUSD || 0)}</span>
                            </div>
                        </div>

                        {/* Card 3: MRR / ARR */}
                        <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">MRR (Doanh thu/tháng)</span>
                                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                    <BarChart3 size={20} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-purple-600 mb-1">
                                {analytics ? formatCurrencyUSD(analytics.mrrUSD) : '$0'}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                                <span>Dự báo ARR (12 tháng):</span>
                                <span className="font-bold text-gray-900">{analytics ? formatCurrencyUSD(analytics.arrUSD) : '$0'}</span>
                            </div>
                        </div>

                        {/* Card 4: Tổng Giao Dịch */}
                        <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng Số Giao Dịch</span>
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <CreditCard size={20} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-amber-600 mb-1">
                                {totalItems} <span className="text-xs font-bold text-gray-400">lần nạp</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                                <span>Doanh nghiệp trả phí:</span>
                                <span className="font-bold text-gray-900">{analytics ? analytics.paidTenantsCount : 0} công ty</span>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown by Subscription Plan */}
                  

                    {/* Filter Controls & Search Table Section */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 mb-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">Chi Tiết Lịch Sử Giao Dịch Nạp Tiền / Thanh Toán</h2>
                                <p className="text-xs text-gray-500">Toàn bộ nhật ký giao dịch nạp tiền ghi nhận qua cổng thanh toán MoMo Sandbox.</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-emerald-600"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="success">Thành công (Success)</option>
                                    <option value="pending">Đang xử lý (Pending)</option>
                                    <option value="failed">Thất bại (Failed)</option>
                                </select>

                                {/* Method Filter */}
                                <select
                                    value={methodFilter}
                                    onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-emerald-600"
                                >
                                    <option value="">Cổng thanh toán</option>
                                    <option value="momo">Ví MoMo</option>
                                    <option value="manual">Thủ công / Chuyển khoản</option>
                                </select>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        {loading ? (
                            <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                                <Loader2 className="animate-spin" size={24} />
                                <span>Đang nạp dữ liệu giao dịch...</span>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 text-sm border border-dashed rounded-2xl">
                                Không tìm thấy lịch sử giao dịch nào phù hợp với điều kiện tìm kiếm.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                                            <th className="py-4 px-6">Mã Giao Dịch (Ref)</th>
                                            <th className="py-4 px-6">Doanh Nghiệp Thanh Toán</th>
                                            <th className="py-4 px-6 text-center">Gói Mua</th>
                                            <th className="py-4 px-6 text-center">Số Tháng</th>
                                            <th className="py-4 px-6 text-right">Số Tiền (VND / USD)</th>
                                            <th className="py-4 px-6 text-center">Cổng Thanh Toán</th>
                                            <th className="py-4 px-6 text-center">Trạng Thái</th>
                                            <th className="py-4 px-6 text-right">Ngày Giao Dịch</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {transactions.map((tx) => (
                                            <tr key={tx._id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="py-4 px-6 font-mono text-xs font-bold text-gray-800">
                                                    {tx.transactionRef || tx._id}
                                                </td>
                                                <td className="py-4 px-6 font-bold text-gray-900">
                                                    {tx.tenantId?.name || 'Doanh nghiệp'}
                                                    <span className="block text-[11px] text-gray-400 font-normal">{tx.tenantId?.domain ? `${tx.tenantId.domain}.smartoffice.com` : ''}</span>
                                                </td>
                                                <td className="py-4 px-6 text-center font-extrabold uppercase text-xs text-purple-700">
                                                    <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100">
                                                        {tx.planCode}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center font-bold text-gray-700 text-xs">
                                                    {tx.months || 12} tháng
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
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                        tx.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        tx.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    }`}>
                                                        {tx.status === 'success' ? <CheckCircle2 size={12} /> : tx.status === 'pending' ? <Clock size={12} /> : <XCircle size={12} />}
                                                        {tx.status === 'success' ? 'Thành công' : tx.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right text-xs text-gray-500 font-medium">
                                                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                                <span>Trang {page} / {totalPages} (Tổng {totalItems} giao dịch)</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold">{page}</span>
                                    <button
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
