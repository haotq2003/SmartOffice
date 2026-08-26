'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { Search, Users, Package, Calendar, ShieldCheck, UserPlus, Loader2, LogOut, ArrowRight, CheckCircle2, TrendingUp, Layers, PieChart } from 'lucide-react';
import { authService } from '../../services/authService';
import { resourceService } from '../../services/resourceService';
import { bookingService } from '../../services/bookingService';
import { UserInfo } from '../../store/authSlice';
import { Resource, Booking } from '../../types/api';
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
    const [usersCount, setUsersCount] = useState<number>(48);
    const [resourcesCount, setResourcesCount] = useState<number>(18);
    const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
    const [loading, setLoading] = useState(true);

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
            const [usersRes, resourcesRes, bookingsRes] = await Promise.all([
                authService.getUsers().catch(() => ({ success: false, data: [] })),
                resourceService.getAllResources().catch(() => ({ success: false, data: [] })),
                bookingService.getAllBookings().catch(() => ({ success: false, data: [] })),
            ]);

            if (usersRes.success && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
                setUsersCount(usersRes.data.length);
            }
            if (resourcesRes.success && Array.isArray(resourcesRes.data) && resourcesRes.data.length > 0) {
                setResourcesCount(resourcesRes.data.length);
            }
            if (bookingsRes.success && Array.isArray(bookingsRes.data) && bookingsRes.data.length > 0) {
                setBookings(bookingsRes.data);
            } else {
                setBookings(MOCK_BOOKINGS);
            }
        } catch (err) {
            console.error('Error fetching admin dashboard data:', err);
            setBookings(MOCK_BOOKINGS);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const displayBookings = bookings.length > 0 ? bookings : MOCK_BOOKINGS;
    const pendingBookings = displayBookings.filter(b => b.status === 'pending').length;
    const approvedBookings = displayBookings.filter(b => b.status === 'approved' || b.status === 'checked_in' || b.status === 'confirmed').length;

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
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{user?.name || 'Tenant Admin'}</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{user?.role || 'Tenant Admin'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-md shadow-blue-100">
                                {user?.name ? user.name.charAt(0) : 'A'}
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

                {/* Content */}
                <div className="p-8">
                    {/* Welcome Title */}
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-2">
                                <TrendingUp size={14} /> Tổng quan Vận hành Công ty
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Bảng Điều Khiển Quản Trị Doanh Nghiệp</h1>
                            <p className="text-gray-500 text-xs">Theo dõi tiến độ duyệt, tài nguyên văn phòng và phân quyền nhân sự toàn hệ thống.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/dashboard/users')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-xs shadow-md shadow-blue-100 cursor-pointer"
                            >
                                <UserPlus size={16} /> Quản lý Nhân sự
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng nhân sự</p>
                                <p className="text-2xl font-extrabold text-gray-900">{usersCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                <Package size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tài nguyên văn phòng</p>
                                <p className="text-2xl font-extrabold text-gray-900">{resourcesCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lịch chờ xử lý</p>
                                <p className="text-2xl font-extrabold text-amber-600">{pendingBookings}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đơn đã phê duyệt</p>
                                <p className="text-2xl font-extrabold text-emerald-600">{approvedBookings}</p>
                            </div>
                        </div>
                    </div>

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
                                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                                                                    b.status === 'approved' || b.status === 'confirmed'
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
                                                                    b.status === 'approved' ? 'Đã duyệt' :
                                                                    b.status === 'checked_in' ? 'Đã giao' :
                                                                    b.status === 'returned' ? 'Đã trả' :
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
                                    </div>

                                    <div>
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
            </main>
        </div>
    );
}
