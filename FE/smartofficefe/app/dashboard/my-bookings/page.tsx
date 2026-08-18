'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { Search, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Package, LogOut } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { Booking } from '../../types/api';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

export default function MyBookingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
        fetchMyBookings();
    }, []);

    const fetchMyBookings = async () => {
        setLoadingBookings(true);
        try {
            const res = await bookingService.getMyBookings();
            if (res.success && Array.isArray(res.data)) {
                setMyBookings(res.data);
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoadingBookings(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const pendingCount = myBookings.filter(b => b.status === 'pending').length;
    const approvedCount = myBookings.filter(b => b.status === 'approved').length;
    const rejectedCount = myBookings.filter(b => b.status === 'rejected').length;

    const filteredBookings = myBookings.filter((b) => {
        const resourceObj = typeof b.resourceId === 'object' ? b.resourceId : null;
        const resourceName = resourceObj?.name || '';
        const matchesSearch = resourceName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = historyFilter === 'all' || b.status === historyFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="my-bookings" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm đơn đặt lịch theo tên tài nguyên, ghi chú..."
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
                                <p className="text-sm font-bold text-gray-900">{user?.name || 'Nhân viên'}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user?.role || 'Employee'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                                {user?.name ? user.name.charAt(0) : 'E'}
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

                {/* Content Area */}
                <div className="p-8">
                    <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900">Lịch sử Đặt lịch của Tôi</h1>
                            <p className="text-gray-500 text-xs mt-1">Theo dõi tiến độ duyệt và danh sách các phòng họp, thiết bị bạn đã đăng ký.</p>
                        </div>
                    </div>

                    {/* Filter Pills (Manager Style) */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {[
                            { label: `Chờ duyệt (${pendingCount})`, value: 'pending' },
                            { label: `Đã duyệt (${approvedCount})`, value: 'approved' },
                            { label: `Từ chối (${rejectedCount})`, value: 'rejected' },
                            { label: `Tất cả (${myBookings.length})`, value: 'all' }
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setHistoryFilter(tab.value as any)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    historyFilter === tab.value
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Booking History Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loadingBookings ? (
                            <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                                <Loader2 className="animate-spin" size={24} />
                                <span>Đang tải lịch sử...</span>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                Không có đơn đặt lịch nào phù hợp trong danh sách này.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                                        <th className="py-4 px-6">Tài nguyên</th>
                                        <th className="py-4 px-6">Thời gian bắt đầu</th>
                                        <th className="py-4 px-6">Thời gian kết thúc</th>
                                        <th className="py-4 px-6">Ghi chú</th>
                                        <th className="py-4 px-6">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {filteredBookings.map((b) => {
                                        const resourceObj = typeof b.resourceId === 'object' ? b.resourceId : null;
                                        return (
                                            <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6 font-semibold text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                                        {resourceObj?.name || 'Tài nguyên'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-gray-600 text-xs">
                                                    {new Date(b.startTime).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="py-4 px-6 text-gray-600 text-xs">
                                                    {new Date(b.endTime).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="py-4 px-6 text-gray-500 text-xs max-w-xs truncate">
                                                    {b.notes || '—'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${b.status === 'approved'
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                : b.status === 'rejected'
                                                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                            }`}
                                                    >
                                                        {b.status === 'approved' && <CheckCircle2 size={14} />}
                                                        {b.status === 'rejected' && <XCircle size={14} />}
                                                        {b.status === 'pending' && <AlertCircle size={14} />}
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
            </main>
        </div>
    );
}
