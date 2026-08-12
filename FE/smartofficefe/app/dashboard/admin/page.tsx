'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { Search, Bell, Users, Package, Calendar, ShieldCheck, UserPlus, Plus, Loader2, LogOut, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { resourceService } from '../../services/resourceService';
import { bookingService } from '../../services/bookingService';
import { UserInfo } from '../../store/authSlice';
import { Resource, Booking } from '../../types/api';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [usersCount, setUsersCount] = useState<number>(0);
    const [resourcesCount, setResourcesCount] = useState<number>(0);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [recentResources, setRecentResources] = useState<Resource[]>([]);
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
                authService.getUsers(),
                resourceService.getAllResources(),
                bookingService.getAllBookings(),
            ]);

            if (usersRes.success && Array.isArray(usersRes.data)) {
                setUsersCount(usersRes.data.length);
            }
            if (resourcesRes.success && Array.isArray(resourcesRes.data)) {
                setResourcesCount(resourcesRes.data.length);
                setRecentResources(resourcesRes.data.slice(0, 4));
            }
            if (bookingsRes.success && Array.isArray(bookingsRes.data)) {
                setBookings(bookingsRes.data);
            }
        } catch (err) {
            console.error('Error fetching admin dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const approvedBookings = bookings.filter(b => b.status === 'approved').length;

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
                                placeholder="Tìm kiếm hệ thống quản trị doanh nghiệp..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <NotificationBell />
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{user?.name || 'Admin'}</p>
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Tenant Admin</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm uppercase">
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
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Bảng Điều Khiển Quản Trị Doanh Nghiệp</h1>
                            <p className="text-gray-500 text-sm">Tổng quan vận hành cơ sở vật chất, nhân sự và quản lý văn phòng.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/dashboard/users')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-xs shadow-md shadow-blue-100 cursor-pointer"
                            >
                                <UserPlus size={16} /> Quản lý nhân sự
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng nhân sự</p>
                                <p className="text-2xl font-extrabold text-gray-900">{usersCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Package size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tài nguyên văn phòng</p>
                                <p className="text-2xl font-extrabold text-gray-900">{resourcesCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lịch chờ xử lý</p>
                                <p className="text-2xl font-extrabold text-gray-900">{pendingBookings}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đơn đã phê duyệt</p>
                                <p className="text-2xl font-extrabold text-gray-900">{approvedBookings}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {/* Users management shortcut */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                    <ShieldCheck size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Quản lý Nhân sự & Phân quyền</h3>
                                <p className="text-gray-500 text-sm mb-6">Tạo và quản lý các tài khoản Manager và Employee trong doanh nghiệp của bạn.</p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/users')}
                                className="flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl font-bold text-xs transition-all cursor-pointer group"
                            >
                                <span>Đi đến trang Quản lý nhân sự</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Resource management shortcut */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-purple-200 transition-all">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                                    <Package size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Danh mục Cơ sở Vật chất</h3>
                                <p className="text-gray-500 text-sm mb-6">Thêm mới và thiết lập trạng thái bảo trì cho các phòng họp, xe công tác và thiết bị.</p>
                            </div>
                            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 text-gray-700 rounded-xl font-bold text-xs">
                                <span>{resourcesCount} tài nguyên hiện đang hoạt động</span>
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">Tối ưu</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Bookings Overview Table */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Hoạt động Đặt lịch Gần đây Toàn Công ty</h2>
                            <span className="text-xs text-gray-400 font-medium">Cập nhật tự động</span>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>Đang nạp dữ liệu quản trị...</span>
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    Chưa có hoạt động đặt lịch nào.
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                                            <th className="py-4 px-6">Người đăng ký</th>
                                            <th className="py-4 px-6">Tài nguyên</th>
                                            <th className="py-4 px-6">Thời gian</th>
                                            <th className="py-4 px-6">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {bookings.slice(0, 6).map((b) => {
                                            const userObj = typeof b.userId === 'object' ? b.userId : null;
                                            const resourceObj = typeof b.resourceId === 'object' ? b.resourceId : null;

                                            return (
                                                <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="font-semibold text-gray-900">{userObj?.name || 'Nhân viên'}</div>
                                                        <div className="text-xs text-gray-400">{userObj?.email}</div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="font-semibold text-blue-600">{resourceObj?.name || 'Tài nguyên'}</div>
                                                        <div className="text-xs text-gray-400 uppercase">{resourceObj?.type}</div>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-600 text-xs">
                                                        {new Date(b.startTime).toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${b.status === 'approved'
                                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                    : b.status === 'rejected'
                                                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                                                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                                }`}
                                                        >
                                                            {b.status === 'approved' ? 'Đã duyệt' : b.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
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
                </div>
            </main>
        </div>
    );
}
