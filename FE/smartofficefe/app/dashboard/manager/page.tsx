'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import UserProfileHeader from '../../components/UserProfileHeader';
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
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'returned' | 'rejected'>('pending');
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

    const handleUpdateStatus = async (bookingId: string, status: 'approved' | 'rejected' | 'pending' | 'checked_in' | 'returned' | 'no_show') => {
        setActionLoadingId(bookingId);
        setStatusMsg(null);
        try {
            const res = await bookingService.updateBookingStatus(bookingId, status);
            if (res.success) {
                const actionLabel = 
                    status === 'approved' ? 'chấp nhận' :
                    status === 'rejected' ? 'từ chối' :
                    status === 'checked_in' ? 'xác nhận giao thiết bị' :
                    status === 'returned' ? 'xác nhận đã nhận lại thiết bị' :
                    status === 'no_show' ? 'báo không nhận' : 'cập nhật';
                setStatusMsg(`Đã ${actionLabel} đơn đặt lịch thành công!`);
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
        const matchesTab = activeTab === 'all' || 
            b.status === activeTab || 
            (activeTab === 'approved' && b.status === 'checked_in') || 
            (activeTab === 'returned' && b.status === 'returned') || 
            (activeTab === 'rejected' && b.status === 'no_show');
        return matchesSearch && matchesTab;
    });

    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const approvedCount = bookings.filter(b => b.status === 'approved' || b.status === 'checked_in').length;
    const returnedCount = bookings.filter(b => b.status === 'returned').length;
    const rejectedCount = bookings.filter(b => b.status === 'rejected' || b.status === 'no_show').length;

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
                        <UserProfileHeader user={user} defaultRole="Manager" />
                    </div>
                </header>

                {/* Content */}
                <div className="p-8">
                    {/* Title */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Cổng Phê Duyệt Manager</h1>
                        <p className="text-gray-500 text-xs">Xem xét phê duyệt các đơn xin mượn tài nguyên văn phòng và thực hiện bàn giao thiết bị.</p>
                    </div>

                    {statusMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium flex justify-between items-center shadow-sm">
                            <span>{statusMsg}</span>
                            <button onClick={() => setStatusMsg(null)} className="text-xs font-bold opacity-60 hover:opacity-100">Đóng</button>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Chờ phê duyệt</p>
                                <p className="text-2xl font-extrabold text-amber-600">{pendingCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đã duyệt / Đã giao</p>
                                <p className="text-2xl font-extrabold text-emerald-600">{approvedCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đã từ chối</p>
                                <p className="text-2xl font-extrabold text-red-600">{rejectedCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng đơn đăng ký</p>
                                <p className="text-2xl font-extrabold text-gray-900">{bookings.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { label: `Chờ duyệt (${pendingCount})`, value: 'pending' },
                            { label: `Đã duyệt (${approvedCount})`, value: 'approved' },
                            { label: `Đã trả (${returnedCount})`, value: 'returned' },
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
                                                    {(() => {
                                                        const isOverdue = (req.status === 'checked_in' || req.status === 'overdue') && new Date() > new Date(req.endTime);
                                                        if (isOverdue) {
                                                            return (
                                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                                                                    ⚠️ Quá hạn trả
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                                                req.status === 'checked_in' ? 'bg-blue-50 text-blue-600' :
                                                                req.status === 'returned' ? 'bg-teal-50 text-teal-600' :
                                                                req.status === 'no_show' ? 'bg-purple-50 text-purple-600' :
                                                                req.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                                            }`}>
                                                                {req.status === 'approved' ? (resourceObj?.type === 'room' ? 'Đã duyệt (Chờ Check-in)' : resourceObj?.type === 'vehicle' ? 'Đã duyệt (Chờ giao xe)' : 'Đã duyệt') :
                                                                 req.status === 'checked_in' ? (resourceObj?.type === 'room' ? '🟢 Đang họp (Đã Check-in)' : resourceObj?.type === 'vehicle' ? '🟢 Đang sử dụng (Đã giao xe)' : 'Đã giao thiết bị') :
                                                                 req.status === 'returned' ? (resourceObj?.type === 'vehicle' ? 'Đã trả xe' : 'Đã trả thiết bị') :
                                                                 req.status === 'no_show' ? (resourceObj?.type === 'room' ? '🔴 Hủy do quá hạn Check-in' : resourceObj?.type === 'vehicle' ? 'Không đến nhận xe' : 'Báo không lấy') :
                                                                 req.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                                <p className="text-sm font-semibold text-blue-600 mb-1">
                                                    📌 {resourceObj?.name || 'Tài nguyên'} <span className="text-gray-400 font-normal">({resourceObj?.type})</span>
                                                </p>

                                                <p className="text-xs text-gray-500 mb-2">
                                                    ⏰ {resourceObj?.type === 'equipment' ? 'Ngày mượn - trả' : 'Thời gian'}: <span className="font-medium text-gray-700">{resourceObj?.type === 'equipment' ? new Date(req.startTime).toLocaleDateString('vi-VN') : new Date(req.startTime).toLocaleString('vi-VN')}</span> đến <span className="font-medium text-gray-700">{resourceObj?.type === 'equipment' ? new Date(req.endTime).toLocaleDateString('vi-VN') : new Date(req.endTime).toLocaleString('vi-VN')}</span>
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

                                        {req.status === 'approved' && (resourceObj?.type === 'equipment' || resourceObj?.type === 'vehicle') && (
                                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                                                <button
                                                    onClick={() => handleUpdateStatus(req._id, 'checked_in')}
                                                    disabled={isActionLoading}
                                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm disabled:opacity-50"
                                                    title="Xác nhận nhân viên đã tới kho nhận đồ"
                                                >
                                                    {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                                    Đã giao thiết bị
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(req._id, 'no_show')}
                                                    disabled={isActionLoading}
                                                    className="px-3.5 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                    title="Báo vi phạm không tới nhận đồ"
                                                >
                                                    {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                                                    {resourceObj?.type === 'vehicle' ? 'Không Đến Nhận Xe' : 'Báo Không Lấy'}
                                                </button>
                                            </div>
                                        )}

                                        {req.status === 'checked_in' && (resourceObj?.type === 'equipment' || resourceObj?.type === 'vehicle') && (
                                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                                                <button
                                                    onClick={() => handleUpdateStatus(req._id, 'returned')}
                                                    disabled={isActionLoading}
                                                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm disabled:opacity-50"
                                                    title="Xác nhận nhân viên đã trả lại thiết bị về kho"
                                                >
                                                    {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                                    {resourceObj?.type === 'vehicle' ? 'Nhận lại xe & chìa khóa' : 'Nhận lại thiết bị'}
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
