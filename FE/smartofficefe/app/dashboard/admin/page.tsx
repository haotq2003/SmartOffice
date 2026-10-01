'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import UserProfileHeader from '../../components/UserProfileHeader';
import { Search, Users, Package, Calendar, ShieldCheck, UserPlus, Loader2, LogOut, ArrowRight, CheckCircle2, TrendingUp, Layers, PieChart, CreditCard, Sparkles, Check, Zap, Clock, Shield, X, AlertCircle, RefreshCw, Building } from 'lucide-react';
import { authService } from '../../services/authService';
import { resourceService } from '../../services/resourceService';
import { bookingService } from '../../services/bookingService';
import { planService } from '../../services/planService';
import { paymentService } from '../../services/paymentService';
import apiClient from '../../services/apiClient';
import { UserInfo } from '../../store/authSlice';
import { Resource, Booking, Plan } from '../../types/api';
import { useRouter } from 'next/navigation';

const MOCK_BOOKINGS: Booking[] = [
    {
        _id: 'mock-1',
        tenantId: 'tenant-1',
        userId: { _id: 'u1', name: 'Nguyễn Văn An', email: 'an.nguyen@smartoffice.com', role: 'employee' } as any,
        resourceId: { _id: 'r1', name: 'Phòng Họp VIP A (Lầu 4)', type: 'room', location: 'Tầng 4' } as any,
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 9000000).toISOString(),
        status: 'pending',
        notes: 'Họp chiến lược Quý 3 với đối tác lớn',
        createdAt: new Date().toISOString(),
    },
    {
        _id: 'mock-2',
        tenantId: 'tenant-1',
        userId: { _id: 'u2', name: 'Lê Thị Bình', email: 'binh.le@smartoffice.com', role: 'employee' } as any,
        resourceId: { _id: 'r2', name: 'Camera 4K Cinema Sony FX3', type: 'equipment', location: 'Kho Thiết bị' } as any,
        startTime: new Date(Date.now() - 86400000).toISOString(),
        endTime: new Date(Date.now() + 172800000).toISOString(),
        status: 'checked_in',
        quantity: 1,
        notes: 'Quay video TVC quảng bá sản phẩm mới',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
        _id: 'mock-3',
        tenantId: 'tenant-1',
        userId: { _id: 'u3', name: 'Trần Minh Cường', email: 'cuong.tran@smartoffice.com', role: 'employee' } as any,
        resourceId: { _id: 'r3', name: 'Xe Sedan Toyota Camry 2.5Q', type: 'vehicle', location: 'Bãi xe Tầng hầm B1' } as any,
        startTime: new Date(Date.now() + 7200000).toISOString(),
        endTime: new Date(Date.now() + 18000000).toISOString(),
        status: 'approved',
        notes: 'Đón đoàn chuyên gia kiểm toán tại Sân bay',
        createdAt: new Date().toISOString(),
    },
    {
        _id: 'mock-4',
        tenantId: 'tenant-1',
        userId: { _id: 'u4', name: 'Phạm Hoàng Nam', email: 'nam.pham@smartoffice.com', role: 'employee' } as any,
        resourceId: { _id: 'r4', name: 'Micro Không Dây Shure BLX24', type: 'equipment', location: 'Kho Thiết bị' } as any,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 259200000).toISOString(),
        status: 'pending',
        quantity: 2,
        notes: 'Sự kiện Townhall Toàn công ty',
        createdAt: new Date().toISOString(),
    },
    {
        _id: 'mock-5',
        tenantId: 'tenant-1',
        userId: { _id: 'u5', name: 'Đặng Thu Thảo', email: 'thao.dang@smartoffice.com', role: 'employee' } as any,
        resourceId: { _id: 'r5', name: 'Phòng Creative Lab (Tầng 2)', type: 'room', location: 'Tầng 2' } as any,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        status: 'approved',
        notes: 'Brainstorm ý tưởng thiết kế giao diện UI/UX',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        _id: 'mock-6',
        tenantId: 'tenant-1',
        userId: { _id: 'u6', name: 'Vũ Đức Anh', email: 'anh.vu@smartoffice.com', role: 'employee' } as any,
        resourceId: { _id: 'r6', name: 'Laptop Dell XPS 15 9530', type: 'equipment', location: 'Kho IT' } as any,
        startTime: new Date(Date.now() - 172800000).toISOString(),
        endTime: new Date(Date.now() - 86400000).toISOString(),
        status: 'returned',
        quantity: 1,
        notes: 'Demo phần mềm cho đối tác tại chỗ',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
    }
];

export default function AdminDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [usersCount, setUsersCount] = useState<number>(1);
    const [resourcesCount, setResourcesCount] = useState<number>(0);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Subscription Plan State
    const [currentPlan, setCurrentPlan] = useState({
        code: 'premium',
        name: 'Gói Chuyên Nghiệp (Premium)',
        price: 49,
        maxUsers: 100,
        maxResources: 25,
        expiryDate: '2026-09-28',
        daysRemaining: 31,
        status: 'active'
    });

    const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [selectedPlanCode, setSelectedPlanCode] = useState<string>('premium');
    const [renewalMonths, setRenewalMonths] = useState<number>(12);
    const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);
    const [renewalSuccessMsg, setRenewalSuccessMsg] = useState<string | null>(null);

    const handleOpenRenewalModal = (planCode?: string) => {
        setSelectedPlanCode(planCode || currentPlan.code);
        setRenewalSuccessMsg(null);
        setIsRenewalModalOpen(true);
    };

    const handleConfirmRenewal = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingRenewal(true);
        setTimeout(() => {
            setIsSubmittingRenewal(false);
            setRenewalSuccessMsg('Yêu cầu gia hạn/nâng cấp gói cước đã được ghi nhận! Bộ phận CSKH SmartOffice sẽ liên hệ bạn ngay.');
            setTimeout(() => {
                setIsRenewalModalOpen(false);
                setRenewalSuccessMsg(null);
            }, 2500);
        }, 800);
    };

    const handleMomoPayment = async (requestType: string = 'captureWallet') => {
        setIsSubmittingRenewal(true);
        try {
            const selectedPlan = availablePlans.find(p => p.code === selectedPlanCode);
            const priceUSD = selectedPlan ? selectedPlan.price : (selectedPlanCode === 'enterprise' ? 199 : selectedPlanCode === 'premium' ? 49 : 0);

            const res = await paymentService.createMomoUrl({
                planCode: selectedPlanCode,
                priceUSD,
                months: renewalMonths,
                tenantId: user?.tenantId,
                requestType
            });

            if (res.success && res.payUrl) {
                window.location.href = res.payUrl;
            } else {
                alert('Khởi tạo giao dịch MoMo không thành công. Vui lòng thử lại!');
                setIsSubmittingRenewal(false);
            }
        } catch (err: any) {
            console.error('MoMo payment error:', err);
            const backendMsg = err.response?.data?.message || err.response?.data?.data?.message || err.message || 'Lỗi kết nối cổng thanh toán MoMo Sandbox.';
            alert(`Khởi tạo thanh toán thất bại: ${backendMsg}`);
            setIsSubmittingRenewal(false);
        }
    };

    const handleVnPayPayment = async () => {
        setIsSubmittingRenewal(true);
        try {
            const selectedPlan = availablePlans.find(p => p.code === selectedPlanCode);
            const priceUSD = selectedPlan ? selectedPlan.price : (selectedPlanCode === 'enterprise' ? 199 : 49);

            const res = await paymentService.createVnPayUrl({
                planCode: selectedPlanCode,
                priceUSD,
                months: renewalMonths,
                tenantId: user?.tenantId,
            });

            if (res.success && res.paymentUrl) {
                window.location.href = res.paymentUrl;
            } else {
                alert('Khởi tạo giao dịch VNPay không thành công. Vui lòng thử lại!');
                setIsSubmittingRenewal(false);
            }
        } catch (err: any) {
            console.error('VNPay payment error:', err);
            const backendMsg = err.response?.data?.message || err.message || 'Lỗi kết nối cổng thanh toán VNPay Sandbox.';
            alert(`Khởi tạo thanh toán VNPay thất bại: ${backendMsg}`);
            setIsSubmittingRenewal(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
        fetchAdminOverviewData();
    }, []);

    const fetchAdminOverviewData = async () => {
        setLoading(true);
        try {
            const [usersRes, resourcesRes, bookingsRes, plansRes, tenantRes] = await Promise.all([
                authService.getUsers().catch(() => ({ success: false, data: [] })),
                resourceService.getAllResources().catch(() => ({ success: false, data: [] })),
                bookingService.getAllBookings().catch(() => ({ success: false, data: [] })),
                planService.getAllPlans().catch(() => ({ success: false, data: [] })),
                apiClient.get('/tenants/me').then(r => r.data).catch(() => ({ success: false, data: null })),
            ]);

            if (usersRes.success && Array.isArray(usersRes.data)) {
                setUsersCount(usersRes.data.length);
            }
            if (resourcesRes.success && Array.isArray(resourcesRes.data)) {
                setResourcesCount(resourcesRes.data.length);
            }
            if (bookingsRes.success && Array.isArray(bookingsRes.data)) {
                setBookings(bookingsRes.data);
            } else {
                setBookings([]);
            }
            if (plansRes && plansRes.success && Array.isArray(plansRes.data) && plansRes.data.length > 0) {
                setAvailablePlans(plansRes.data);
            }
            if (tenantRes && tenantRes.success && tenantRes.data) {
                const tData = tenantRes.data;
                const pDetail = tData.planDetails || {};
                const isSub = tData.isSubscribed;
                const code = tData.plan || pDetail.code || 'none';
                const status = tData.status || 'pending_payment';
                const daysRemaining = tData.daysRemaining !== undefined ? tData.daysRemaining : 0;

                setCurrentPlan({
                    code,
                    name: pDetail.name || (code === 'enterprise' ? 'Gói Tập Đoàn (Enterprise)' : code === 'premium' ? 'Gói Chuyên Nghiệp (Premium)' : 'Chưa kích hoạt gói'),
                    price: pDetail.price !== undefined ? pDetail.price : (code === 'enterprise' ? 199 : code === 'premium' ? 49 : 0),
                    maxUsers: pDetail.maxUsers !== undefined ? pDetail.maxUsers : (code === 'enterprise' ? -1 : code === 'premium' ? 100 : 0),
                    maxResources: pDetail.maxResources !== undefined ? pDetail.maxResources : (code === 'enterprise' ? -1 : code === 'premium' ? 25 : 0),
                    expiryDate: tData.expiryDate || null,
                    daysRemaining,
                    status
                });

                if (!isSub || status !== 'active' || code === 'none' || daysRemaining <= 0) {
                    setIsRenewalModalOpen(true);
                }
            }
        } catch (err) {
            console.error('Error fetching admin dashboard data:', err);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const displayBookings = bookings;
    const pendingBookings = displayBookings.filter(b => b.status === 'pending').length;
    const approvedBookings = displayBookings.filter(b => b.status === 'approved' || b.status === 'checked_in' || b.status === 'confirmed').length;

    const isUnsubscribed = currentPlan.code === 'none' || currentPlan.status !== 'active' || currentPlan.daysRemaining <= 0;

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
                                placeholder="Tìm kiếm tài nguyên, đơn đặt lịch, nhân sự..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <NotificationBell />
                        <div className="h-8 w-px bg-gray-200"></div>
                        <UserProfileHeader user={user} defaultRole="Tenant Admin" />
                    </div>
                </header>

                {/* Content */}
                <div className="p-8">
                    {/* Welcome Title */}


                    {/* Active Subscription Plan Banner Widget (Dynamic Expiration Warning) */}
                    <div className={`mb-8 border rounded-2xl p-6 shadow-sm transition-all relative overflow-hidden ${
                        isUnsubscribed
                            ? 'bg-rose-50/80 border-rose-200 text-rose-900 shadow-rose-100 ring-2 ring-rose-300'
                            : 'bg-white border-blue-100/80'
                    }`}>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/60 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>

                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="space-y-2 max-w-xl">
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                                        isUnsubscribed
                                            ? 'bg-rose-100 text-rose-700 border-rose-300'
                                            : 'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}>
                                        <CreditCard size={13} className={isUnsubscribed ? 'text-rose-600' : 'text-blue-600'} />
                                        Gói Cước Doanh Nghiệp
                                    </span>
                                    {isUnsubscribed ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800 border border-rose-300 flex items-center gap-1">
                                            {currentPlan.code === 'none' || currentPlan.status === 'pending_payment'
                                                ? '🔴 BẮT BUỘC MUA GÓI ĐỂ SỬ DỤNG'
                                                : '⚠️ ĐÃ HẾT HẠN (TẠM KHÓA)'}
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Đang hoạt động
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                    {currentPlan.name}
                                    {currentPlan.price > 0 && (
                                        <span className="text-xs font-semibold text-gray-500">(${currentPlan.price}/tháng)</span>
                                    )}
                                </h2>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {isUnsubscribed ? (
                                        <span className="font-bold text-rose-700">
                                            {currentPlan.code === 'none' || currentPlan.status === 'pending_payment'
                                                ? '🚨 Doanh nghiệp vừa tạo chưa có gói cước kích hoạt. Bạn bắt buộc phải mua gói dịch vụ để mở khóa hệ thống, tạo phòng họp và thêm nhân viên!'
                                                : `🚨 Gói cước đã hết hạn vào ngày ${currentPlan.expiryDate}. Các thao tác tạo dữ liệu mới bị tạm khóa. Vui lòng gia hạn ngay để mở khóa!`}
                                        </span>
                                    ) : (
                                        <>Thời hạn gói đến ngày <span className="font-bold text-gray-800">{currentPlan.expiryDate}</span> (Còn <span className="font-bold text-blue-600">{currentPlan.daysRemaining} ngày</span>). Mở khóa toàn bộ tính năng Mô phỏng cửa quẹt thẻ, Thông báo tự động và Phê duyệt nhanh.</>
                                    )}
                                </p>
                            </div>

                            {/* Limits & Action */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                                <button
                                    onClick={() => handleOpenRenewalModal()}
                                    className={`px-6 py-3.5 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border border-transparent whitespace-nowrap cursor-pointer shrink-0 ${
                                        isUnsubscribed
                                            ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 animate-pulse'
                                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                                    }`}
                                >
                                    <Zap size={16} /> {isUnsubscribed ? '⚡ Mua Gói Kích Hoạt Ngay' : 'Gia Hạn / Nâng Cấp Gói'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}


                    {/* Quick Access Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Users management shortcut */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all hover:shadow-md">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
                                    <Users size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Quản lý Nhân sự</h3>
                                <p className="text-gray-500 text-xs mb-6 leading-relaxed">Tạo và phân quyền tài khoản Manager & Employee trong doanh nghiệp.</p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/users')}
                                className="flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl font-bold text-xs transition-all cursor-pointer group"
                            >
                                <span>{usersCount} nhân sự</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-blue-600" />
                            </button>
                        </div>

                        {/* Resource management shortcut */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-purple-200 transition-all hover:shadow-md">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100">
                                    <Package size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Cơ sở Vật chất</h3>
                                <p className="text-gray-500 text-xs mb-6 leading-relaxed">Khai báo phòng họp, xe công tác và quản lý thiết bị trong kho công ty.</p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/resources')}
                                className="flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-xl font-bold text-xs transition-all cursor-pointer group"
                            >
                                <span>{resourcesCount} tài nguyên</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-purple-600" />
                            </button>
                        </div>

                        {/* Door Simulator shortcut */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all hover:shadow-md">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                                    <ShieldCheck size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Quẹt Thẻ Cửa</h3>
                                <p className="text-gray-500 text-xs mb-6 leading-relaxed">Giả lập thiết bị Smart Lock mở cửa phòng họp theo thời gian thực.</p>
                            </div>
                            <button
                                onClick={() => router.push('/door-simulator')}
                                className="flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-xl font-bold text-xs transition-all cursor-pointer group"
                            >
                                <span>Mở Mô phỏng Cửa</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-emerald-600" />
                            </button>
                        </div>
                    </div>

                    {/* Analytics Summary & Recent Bookings Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Bookings Overview Table */}
                        <div className="lg:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Layers size={18} className="text-blue-600" />
                                    Hoạt động Đặt lịch Gần đây Toàn Công ty
                                </h2>
                                <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">● Live Update</span>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {loading ? (
                                    <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>Đang nạp dữ liệu quản trị...</span>
                                    </div>
                                ) : displayBookings.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                                        <Calendar size={24} className="text-gray-300" />
                                        <span>Chưa có hoạt động đặt lịch nào trong doanh nghiệp của bạn.</span>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                                                <th className="py-4 px-6">Người đăng ký</th>
                                                <th className="py-4 px-6">Tài nguyên</th>
                                                <th className="py-4 px-6">Thời gian</th>
                                                <th className="py-4 px-6 text-right">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm">
                                            {displayBookings.slice(0, 6).map((b) => {
                                                const userObj = typeof b.userId === 'object' ? b.userId : null;
                                                const resourceObj = typeof b.resourceId === 'object' ? b.resourceId : null;

                                                return (
                                                    <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="font-bold text-gray-900">{userObj?.name || 'Nhân viên'}</div>
                                                            <div className="text-xs text-gray-400">{userObj?.email}</div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="font-semibold text-blue-600">{resourceObj?.name || 'Tài nguyên'}</div>
                                                            <div className="text-[10px] text-gray-400 uppercase font-bold">{resourceObj?.type}</div>
                                                        </td>
                                                        <td className="py-4 px-6 text-gray-600 text-xs">
                                                            {resourceObj?.type === 'equipment' ? new Date(b.startTime).toLocaleDateString('vi-VN') : new Date(b.startTime).toLocaleString('vi-VN')}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${b.status === 'approved' || b.status === 'confirmed'
                                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                        : b.status === 'checked_in'
                                                                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                                            : b.status === 'returned'
                                                                                ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                                                : b.status === 'rejected'
                                                                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                                                                    : b.status === 'cancelled'
                                                                                        ? 'bg-gray-50 text-gray-600 border border-gray-100'
                                                                                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                                    }`}
                                                            >
                                                                {
                                                                    b.status === 'approved' ? (resourceObj?.type === 'room' ? 'Đã duyệt (Chờ Check-in)' : 'Đã duyệt') :
                                                                        b.status === 'checked_in' ? (resourceObj?.type === 'room' ? '🟢 Đã Check-in' : 'Đã giao') :
                                                                            b.status === 'returned' ? 'Đã trả' :
                                                                                b.status === 'no_show' ? (resourceObj?.type === 'room' ? '🔴 Hủy do quá hạn Check-in' : 'Không lấy') :
                                                                                    b.status === 'rejected' ? 'Từ chối' :
                                                                                        b.status === 'confirmed' ? 'Xác nhận' :
                                                                                            b.status === 'cancelled' ? 'Đã hủy' : 'Chờ duyệt'
                                                                }
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Analytics Breakdown Side Widget */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <PieChart size={20} className="text-purple-600" />
                                    <h3 className="text-base font-bold text-gray-900">Phân bổ Nhu cầu Tài nguyên</h3>
                                </div>
                                <p className="text-xs text-gray-400 mb-6">Tỉ lệ đăng ký tài nguyên theo mục đích hoạt động tháng này.</p>

                                <div className="space-y-5">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-gray-700">Phòng họp & Hội thảo</span>
                                            <span className="text-blue-600">62%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: '62%' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-gray-700">Thiết bị mượn (Camera, Laptop)</span>
                                            <span className="text-emerald-600">26%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '26%' }}></div>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-gray-700">Xe công tác đưa đón</span>
                                            <span className="text-purple-600">12%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-purple-600 h-full rounded-full" style={{ width: '12%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
                                <p className="text-xs font-bold text-blue-900 mb-1">💡 Khuyến nghị Vận hành</p>
                                <p className="text-[11px] text-blue-700 leading-relaxed">
                                    Nhu cầu mượn thiết bị quay chụp tăng 35% trong tuần này. Hãy đảm bảo kiểm kê số lượng kho đầy đủ.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Renewal & Mandatory Activation Modal */}
                {isRenewalModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
                            {!isUnsubscribed && (
                                <button
                                    onClick={() => setIsRenewalModalOpen(false)}
                                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            )}

                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                                    isUnsubscribed ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    {isUnsubscribed ? <Zap size={24} /> : <CreditCard size={24} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-gray-900">
                                            {currentPlan.code === 'none' || currentPlan.status === 'pending_payment'
                                                ? 'Kích Hoạt Gói Doanh Nghiệp (Bắt buộc)'
                                                : isUnsubscribed
                                                    ? 'Gói Cước Đã Hết Hạn - Vui Lòng Gia Hạn'
                                                    : 'Gia Hạn & Nâng Cấp Gói Cước SaaS'}
                                        </h2>
                                        {isUnsubscribed && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">
                                                Bắt buộc thanh toán
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {currentPlan.code === 'none' || currentPlan.status === 'pending_payment'
                                            ? 'Doanh nghiệp vừa được tạo. Bạn bắt buộc phải mua gói dịch vụ để kích hoạt quyền quản trị, thêm nhân sự và đặt tài nguyên.'
                                            : isUnsubscribed
                                                ? 'Gói cước của doanh nghiệp bạn đã hết thời hạn sử dụng. Hãy chọn gói để mở khóa hệ thống.'
                                                : 'Lựa chọn gói dịch vụ phù hợp với quy mô doanh nghiệp của bạn'}
                                    </p>
                                </div>
                            </div>

                            {renewalSuccessMsg ? (
                                <div className="my-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                                    <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
                                    <h3 className="text-lg font-bold text-emerald-900">Yêu Cầu Đã Được Gửi!</h3>
                                    <p className="text-xs text-emerald-700 max-w-md mx-auto">{renewalSuccessMsg}</p>
                                </div>
                            ) : (
                                <div className="mt-6 space-y-6">
                                    {/* Plan Options */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(() => {
                                            const paidPlans = availablePlans.filter(p => p.code !== 'free' && p.code !== 'none');
                                            const plansToRender = paidPlans.length > 0 ? paidPlans : [
                                                {
                                                    _id: 'default-prem',
                                                    name: 'Gói Chuyên Nghiệp (Premium)',
                                                    code: 'premium',
                                                    price: 49,
                                                    maxUsers: 100,
                                                    maxResources: 25,
                                                    features: ['Tối đa 100 nhân viên', 'Tối đa 25 phòng & thiết bị', 'Mô phỏng quẹt cửa Smart Lock', 'Báo cáo & Phân quyền quản lý']
                                                },
                                                {
                                                    _id: 'default-ent',
                                                    name: 'Gói Tập Đoàn (Enterprise)',
                                                    code: 'enterprise',
                                                    price: 199,
                                                    maxUsers: -1,
                                                    maxResources: -1,
                                                    features: ['Không giới hạn nhân viên', 'Không giới hạn tài nguyên', 'Tích hợp IoT nâng cao', 'Hỗ trợ kỹ thuật 24/7 & SLA 99.9%']
                                                }
                                            ];

                                            return plansToRender.map((planItem) => {
                                                const isSelected = selectedPlanCode === planItem.code;
                                                const isEnterprise = planItem.code === 'enterprise';

                                                return (
                                                    <div
                                                        key={planItem._id || planItem.code}
                                                        onClick={() => setSelectedPlanCode(planItem.code)}
                                                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${isSelected
                                                                ? isEnterprise
                                                                    ? 'border-purple-600 bg-purple-50/40 shadow-md ring-2 ring-purple-200'
                                                                    : 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-200'
                                                                : 'border-gray-100 hover:border-gray-200 bg-white'
                                                            }`}
                                                    >
                                                        {planItem.code === 'premium' && (
                                                            <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                                                Phổ biến nhất
                                                            </div>
                                                        )}
                                                        {isEnterprise && (
                                                            <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                                                Toàn diện
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className={`text-xs font-black uppercase tracking-wider ${isEnterprise ? 'text-purple-600' : 'text-blue-600'}`}>
                                                                    {planItem.code}
                                                                </span>
                                                                {isSelected && (
                                                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                        <Check size={12} /> Đang chọn
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="font-extrabold text-gray-900 text-base mb-1">{planItem.name}</h4>
                                                            <p className={`text-2xl font-black mb-3 ${isEnterprise ? 'text-purple-600' : 'text-blue-600'}`}>
                                                                ${planItem.price} <span className="text-xs font-normal text-gray-400">/ tháng</span>
                                                            </p>
                                                            <ul className="text-xs space-y-2 text-gray-600 mb-4">
                                                                {Array.isArray(planItem.features) && planItem.features.length > 0 ? (
                                                                    planItem.features.map((feat, idx) => (
                                                                        <li key={idx} className="flex items-center gap-1.5">
                                                                            <Check size={14} className="text-emerald-500 shrink-0" />
                                                                            <span>{feat}</span>
                                                                        </li>
                                                                    ))
                                                                ) : (
                                                                    <>
                                                                        <li className="flex items-center gap-1.5">
                                                                            <Check size={14} className="text-emerald-500 shrink-0" />
                                                                            <span>Tối đa {planItem.maxUsers === -1 ? 'Không giới hạn' : `${planItem.maxUsers} nhân viên`}</span>
                                                                        </li>
                                                                        <li className="flex items-center gap-1.5">
                                                                            <Check size={14} className="text-emerald-500 shrink-0" />
                                                                            <span>Tối đa {planItem.maxResources === -1 ? 'Không giới hạn' : `${planItem.maxResources} tài nguyên`}</span>
                                                                        </li>
                                                                    </>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>

                                    {/* Duration selection */}
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Thời hạn đăng ký gói:</p>
                                            <p className="text-[11px] text-gray-500">Thanh toán 12 tháng được chiết khấu thêm 15% tổng chi phí.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {[1, 3, 6, 12].map((m) => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => setRenewalMonths(m)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${renewalMonths === m
                                                            ? 'bg-gray-900 text-white shadow-sm'
                                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {m} Tháng {m === 12 && '(-15%)'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price calculation summary */}
                                    {(() => {
                                        const curPlanPrice = selectedPlanCode === 'enterprise' ? 199 : 49;
                                        const rawUSD = curPlanPrice * renewalMonths;
                                        const calcUSD = renewalMonths === 12 ? Math.round(rawUSD * 0.85) : rawUSD;
                                        const calcVND = (calcUSD * 25400).toLocaleString('vi-VN');

                                        return (
                                            <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                                                <div>
                                                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Tổng Chi Phí Kích Hoạt</span>
                                                    <div className="text-2xl font-black text-gray-900">
                                                        ${calcUSD} USD <span className="text-sm font-semibold text-gray-500">(~{calcVND} VNĐ)</span>
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-blue-700">
                                                    <div>Gói: <span className="font-bold">{selectedPlanCode === 'enterprise' ? 'Enterprise' : 'Premium'}</span></div>
                                                    <div>Kỳ hạn: <span className="font-bold">{renewalMonths} tháng</span> {renewalMonths === 12 && <span className="text-emerald-600 font-bold">(Đã giảm 15%)</span>}</div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Action Buttons: MoMo & VNPay */}
                                    <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                                        {isUnsubscribed ? (
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                            >
                                                <LogOut size={14} /> Đăng xuất
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setIsRenewalModalOpen(false)}
                                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                            >
                                                Hủy
                                            </button>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                                            {/* VNPay Button */}
                                            <button
                                                type="button"
                                                onClick={handleVnPayPayment}
                                                disabled={isSubmittingRenewal}
                                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                            >
                                                {isSubmittingRenewal ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        <span>Đang chuyển VNPay...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap size={15} />
                                                        <span>Thanh Toán VNPay Sandbox</span>
                                                    </>
                                                )}
                                            </button>

                                            {/* MoMo Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleMomoPayment()}
                                                disabled={isSubmittingRenewal}
                                                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-pink-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                            >
                                                {isSubmittingRenewal ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        <span>Đang chuyển MoMo...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard size={15} />
                                                        <span>Thanh Toán Ví MoMo Sandbox</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
