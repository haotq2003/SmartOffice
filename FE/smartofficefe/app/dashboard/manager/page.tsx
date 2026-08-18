'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { Search, Bell, CheckSquare, XCircle, CheckCircle2, Clock, Calendar, UserCheck, Loader2, LogOut } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { Booking } from '../../types/api';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

export default function ManagerDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
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
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await bookingService.getAllBookings();
            if (res.success && Array.isArray(res.data)) {
                setBookings(res.data);
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (bookingId: string, status: 'approved' | 'rejected') => {
        setActionLoadingId(bookingId);
        setStatusMsg(null);
        try {
            const res = await bookingService.updateBookingStatus(bookingId, status);
            if (res.success) {
                setStatusMsg(`Đã ${status === 'approved' ? 'chấp nhận' : 'từ chối'} đơn đặt lịch thành công!`);
                fetchBookings();
            }
        } catch (err: any) {
            console.error(err);
            setStatusMsg('Cập nhật trạng thái thất bại.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const filteredBookings = bookings.filter((b) => {
        const userObj = typeof b.userId === 'object' ? b.userId : null;
        const resourceObj = typeof b.resourceId === 'object' ? b.resourceId : null;

        const userName = userObj?.name || '';
        const resourceName = resourceObj?.name || '';

        const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) || resourceName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || b.status === activeTab;
        return matchesSearch && matchesTab;
    });

    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const approvedCount = bookings.filter(b => b.status === 'approved').length;
    const rejectedCount = bookings.filter(b => b.status === 'rejected').length;

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
                                placeholder="Tìm kiếm theo tên người đăng ký hoặc tên phòng/xe..."
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
                                <p className="text-sm font-bold text-gray-900">{user?.name || 'Manager'}</p>
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{user?.role || 'Manager'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                                {user?.name ? user.name.charAt(0) : 'M'}
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
                    {/* Title */}
                    {/* <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Cổng Phê Duyệt Manager</h1>
                        <p className="text-gray-500 text-sm">Xem xét và phê duyệt các đơn xin mượn tài nguyên văn phòng từ nhân viên.</p>
                    </div> */}

                    {/* {statusMsg && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl font-medium">
                            {statusMsg}
                        </div>
                    )} */}

                    {/* Stats */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Chờ phê duyệt</p>
                                <p className="text-2xl font-extrabold text-gray-900">{pendingCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đã chấp nhận</p>
                                <p className="text-2xl font-extrabold text-gray-900">{approvedCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đã từ chối</p>
                                <p className="text-2xl font-extrabold text-gray-900">{rejectedCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng đơn đăng ký</p>
                                <p className="text-2xl font-extrabold text-gray-900">{bookings.length}</p>
                            </div>
                        </div>
                    </div> */}

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { label: `Chờ duyệt (${pendingCount})`, value: 'pending' },
                            { label: `Đã duyệt (${approvedCount})`, value: 'approved' },
                            { label: `Từ chối (${rejectedCount})`, value: 'rejected' },
                            { label: `Tất cả (${bookings.length})`, value: 'all' }
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value as any)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${activeTab === tab.value
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Approvals List */}
                    {loading ? (
                        <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                            <Loader2 className="animate-spin" size={24} />
                            <span>Đang tải danh sách yêu cầu...</span>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="p-12 bg-white rounded-2xl border border-gray-100 text-center text-gray-400">
                            Không có đơn nào trong danh sách này.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredBookings.map((req) => {
                                const userObj = typeof req.userId === 'object' ? req.userId : null;
                                const resourceObj = typeof req.resourceId === 'object' ? req.resourceId : null;
                                const isActionLoading = actionLoadingId === req._id;

                                return (
                                    <div key={req._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-100 transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-base uppercase shrink-0">
                                                {userObj?.name ? userObj.name.charAt(0) : 'U'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-gray-900 text-base">{userObj?.name || 'Nhân viên'}</h3>
                                                    <span className="text-xs text-gray-400">({userObj?.email})</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : req.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                                                    </span>
                                                </div>

                                                <p className="text-sm font-semibold text-blue-600 mb-1">
                                                    📌 {resourceObj?.name || 'Tài nguyên'} <span className="text-gray-400 font-normal">({resourceObj?.type})</span>
                                                </p>

                                                <p className="text-xs text-gray-500 mb-2">
                                                    ⏰ Thời gian: <span className="font-medium text-gray-700">{new Date(req.startTime).toLocaleString('vi-VN')}</span> đến <span className="font-medium text-gray-700">{new Date(req.endTime).toLocaleString('vi-VN')}</span>
                                                </p>

                                                {req.notes && (
                                                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs text-gray-600 max-w-xl">
                                                        💬 <span className="italic">"{req.notes}"</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {req.status === 'pending' && (
                                            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                                                <button
                                                    onClick={() => handleUpdateStatus(req._id, 'rejected')}
                                                    disabled={isActionLoading}
                                                    className="flex-1 md:flex-none px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                >
                                                    {isActionLoading ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                                                    Từ chối
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(req._id, 'approved')}
                                                    disabled={isActionLoading}
                                                    className="flex-1 md:flex-none px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-100 disabled:opacity-50"
                                                >
                                                    {isActionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                                    Phê duyệt
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
