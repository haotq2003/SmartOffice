'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import UserProfileHeader from '../../components/UserProfileHeader';
import Link from 'next/link';
import { Search, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Package, LogOut, AlertTriangle, CreditCard, ExternalLink, Sparkles, DoorOpen, Radio, X } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import apiClient from '../../services/apiClient';
import { Booking } from '../../types/api';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

export default function MyBookingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'approved' | 'returned' | 'rejected'>('all');

    // Custom Modal & Toast States
    const [selectedCancelBooking, setSelectedCancelBooking] = useState<Booking | null>(null);
    const [statusToast, setStatusToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Demo Swipe Card Modal States
    const [swipeModalBooking, setSwipeModalBooking] = useState<Booking | null>(null);
    const [swipeCardCode, setSwipeCardCode] = useState('');
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeSuccess, setSwipeSuccess] = useState(false);
    const [swipeMessage, setSwipeMessage] = useState<string | null>(null);

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
            console.error('Error fetching my bookings:', err);
        } finally {
            setLoadingBookings(false);
        }
    };

    const confirmCancelBooking = async () => {
        if (!selectedCancelBooking) return;
        const bookingId = selectedCancelBooking._id;
        setCancellingId(bookingId);
        setStatusToast(null);
        try {
            const res = await bookingService.updateBookingStatus(bookingId, 'cancelled');
            if (res.success) {
                setStatusToast({ type: 'success', message: 'Hủy đơn đặt lịch thành công!' });
                setSelectedCancelBooking(null);
                fetchMyBookings();
            }
        } catch (err: any) {
            console.error(err);
            setStatusToast({
                type: 'error',
                message: err.response?.data?.message || 'Không thể hủy đơn đặt lịch. Vui lòng thử lại.'
            });
        } finally {
            setCancellingId(null);
        }
    };

    // RFID Beep sound effect
    const playBeepSound = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const audioCtx = new AudioContextClass();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz crisp beep
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.22);
        } catch (e) {
            // Audio context not allowed or failed
        }
    };

    // Open demo swipe modal
    const handleOpenSwipeModal = (b: Booking) => {
        setSwipeModalBooking(b);
        setSwipeCardCode(user?.rfidCardId || user?.email || 'RFID-1004');
        setSwipeSuccess(false);
        setSwipeMessage(null);
    };

    // Execute swipe simulation
    const handleExecuteSwipe = async () => {
        if (!swipeModalBooking) return;
        const rId = typeof swipeModalBooking.resourceId === 'object' ? (swipeModalBooking.resourceId as any)?._id : swipeModalBooking.resourceId;
        if (!rId) return;

        setIsSwiping(true);
        setSwipeMessage(null);
        try {
            const cardToUse = swipeCardCode.trim() || user?.rfidCardId || user?.email || 'RFID-1004';
            const res = await apiClient.post('/access-control/swipe', {
                resourceId: rId,
                cardCode: cardToUse,
                bookingId: swipeModalBooking._id
            });

            if (res.data?.success) {
                playBeepSound();
                setSwipeSuccess(true);
                setSwipeMessage(res.data.message || 'Cửa đã mở khóa thành công!');
                setStatusToast({
                    type: 'success',
                    message: `🟢 Check-in phòng họp thành công! Lịch hẹn giờ hủy phòng sau 15 phút trên Redis đã được hủy tự động.`
                });
                setTimeout(() => {
                    setSwipeModalBooking(null);
                    fetchMyBookings();
                }, 1600);
            } else {
                setSwipeMessage(res.data?.message || 'Quẹt thẻ không thành công.');
            }
        } catch (err: any) {
            setSwipeMessage(err.response?.data?.message || 'Lỗi khi kết nối tới thiết bị quẹt thẻ.');
        } finally {
            setIsSwiping(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const pendingCount = myBookings.filter(b => b.status === 'pending').length;
    const approvedCount = myBookings.filter(b => b.status === 'approved' || b.status === 'checked_in' || b.status === 'confirmed').length;
    const returnedCount = myBookings.filter(b => b.status === 'returned').length;
    const rejectedCount = myBookings.filter(b => b.status === 'rejected' || b.status === 'no_show' || b.status === 'cancelled').length;

    const filteredBookings = myBookings.filter((b) => {
        const resourceObj = typeof b.resourceId === 'object' ? b.resourceId : null;
        const resourceName = resourceObj?.name || '';
        const matchesSearch = resourceName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = historyFilter === 'all' || 
            b.status === historyFilter || 
            (historyFilter === 'approved' && (b.status === 'checked_in' || b.status === 'confirmed')) ||
            (historyFilter === 'returned' && b.status === 'returned') ||
            (historyFilter === 'rejected' && (b.status === 'no_show' || b.status === 'cancelled'));
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
                        <UserProfileHeader user={user} defaultRole="Employee" />
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8">
                    {/* Title */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Lịch Sử Đặt Phòng & Thiết Bị</h1>
                        <p className="text-gray-500 text-sm">Theo dõi danh sách các đơn mượn thiết bị và đặt phòng họp của bạn.</p>
                    </div>

                    {/* Status Toast */}
                    {statusToast && (
                        <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm border animate-in fade-in slide-in-from-top-2 ${
                            statusToast.type === 'success' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                            <div className="flex items-center gap-2">
                                {statusToast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-rose-600" />}
                                <span>{statusToast.message}</span>
                            </div>
                            <button onClick={() => setStatusToast(null)} className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer">
                                Đóng
                            </button>
                        </div>
                    )}

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {[
                            { label: `Chờ duyệt (${pendingCount})`, value: 'pending' },
                            { label: `Đang mượn / Đã duyệt (${approvedCount})`, value: 'approved' },
                            { label: `Đã trả thiết bị (${returnedCount})`, value: 'returned' },
                            { label: `Từ chối / Đã hủy (${rejectedCount})`, value: 'rejected' },
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
                                        <th className="py-4 px-6 text-right">Thao tác</th>
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
                                                    {resourceObj?.type === 'equipment' ? new Date(b.startTime).toLocaleDateString('vi-VN') : new Date(b.startTime).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="py-4 px-6 text-gray-600 text-xs">
                                                    {resourceObj?.type === 'equipment' ? new Date(b.endTime).toLocaleDateString('vi-VN') : new Date(b.endTime).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="py-4 px-6 text-gray-500 text-xs max-w-xs truncate">
                                                    {b.notes || '—'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span
                                                         className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                                             ((b.status === 'checked_in' || b.status === 'overdue') && new Date() > new Date(b.endTime))
                                                                 ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                                                                 : b.status === 'returned'
                                                                     ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                                                     : b.status === 'approved' || b.status === 'confirmed'
                                                                         ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                         : b.status === 'checked_in'
                                                                             ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                                             : b.status === 'no_show'
                                                                                 ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                                                 : b.status === 'rejected'
                                                                                     ? 'bg-red-50 text-red-600 border border-red-100'
                                                                                     : b.status === 'cancelled'
                                                                                         ? 'bg-gray-50 text-gray-600 border border-gray-100'
                                                                                         : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                             }`}
                                                     >
                                                         {b.status === 'returned' && <CheckCircle2 size={14} className="text-teal-600" />}
                                                         {(b.status === 'approved' || b.status === 'confirmed' || b.status === 'checked_in') && <CheckCircle2 size={14} />}
                                                         {(b.status === 'rejected' || b.status === 'no_show' || b.status === 'cancelled') && <XCircle size={14} />}
                                                         {b.status === 'pending' && <AlertCircle size={14} />}
                                                         {
                                                             ((b.status === 'checked_in' || b.status === 'overdue') && new Date() > new Date(b.endTime)) ? '⚠️ Quá hạn trả' :
                                                             b.status === 'returned' ? (resourceObj?.type === 'vehicle' ? 'Đã trả xe' : 'Đã trả thiết bị') :
                                                             b.status === 'approved' ? (resourceObj?.type === 'room' ? 'Đã duyệt (Chờ Check-in)' : resourceObj?.type === 'vehicle' ? 'Đã duyệt (Chờ nhận xe)' : 'Đã duyệt') :
                                                             b.status === 'checked_in' ? (resourceObj?.type === 'room' ? '🟢 Đang họp (Đã Check-in)' : resourceObj?.type === 'vehicle' ? '🟢 Đang sử dụng (Đã giao xe)' : 'Đã giao thiết bị') :
                                                             b.status === 'no_show' ? (resourceObj?.type === 'room' ? '🔴 Hủy do quá hạn Check-in' : resourceObj?.type === 'vehicle' ? 'Không đến nhận xe' : 'Báo không lấy') :
                                                             b.status === 'rejected' ? 'Từ chối' :
                                                             b.status === 'confirmed' ? 'Xác nhận' :
                                                             b.status === 'cancelled' ? 'Đã hủy' : 'Chờ duyệt'
                                                         }
                                                     </span>
                                                 </td>
                                                 <td className="py-4 px-6 text-right">
                                                     <div className="flex items-center justify-end gap-2">
                                                         {/* Demo Quẹt Thẻ RFID (Dành cho phòng họp đã duyệt đang chờ check-in) */}
                                                         {resourceObj?.type === 'room' && (b.status === 'approved' || b.status === 'confirmed') && (
                                                             <button
                                                                 onClick={() => handleOpenSwipeModal(b)}
                                                                 className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-200 inline-flex items-center gap-1.5 active:scale-95 animate-pulse hover:animate-none"
                                                                 title="Mô phỏng quẹt thẻ RFID mở cửa check-in phòng họp"
                                                             >
                                                                 <CreditCard size={14} />
                                                                 Demo Quẹt Thẻ
                                                             </button>
                                                         )}

                                                         {(b.status === 'pending' || b.status === 'approved') && (
                                                             <button
                                                                 onClick={() => setSelectedCancelBooking(b)}
                                                                 className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                                                             >
                                                                 <XCircle size={14} />
                                                                 Hủy đơn
                                                             </button>
                                                         )}
                                                         {b.status === 'returned' && (
                                                             <span className="text-xs font-bold text-teal-600 inline-flex items-center gap-1">
                                                                 <CheckCircle2 size={13} /> Hoàn tất
                                                             </span>
                                                         )}
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

            {/* Custom Confirmation Modal */}
            {selectedCancelBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100 shadow-inner">
                            <AlertTriangle size={28} />
                        </div>

                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                            Xác nhận Hủy Đơn Đặt Lịch
                        </h3>

                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn hủy đơn đặt lịch cho <span className="font-bold text-gray-900">"{typeof selectedCancelBooking.resourceId === 'object' ? selectedCancelBooking.resourceId?.name : 'Tài nguyên'}"</span> không? Thao tác này không thể hoàn tác.
                        </p>

                        <div className="flex items-center gap-3 w-full">
                            <button
                                onClick={() => setSelectedCancelBooking(null)}
                                disabled={cancellingId === selectedCancelBooking._id}
                                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={confirmCancelBooking}
                                disabled={cancellingId === selectedCancelBooking._id}
                                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-200 disabled:opacity-50"
                            >
                                {cancellingId === selectedCancelBooking._id ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        <span>Đang hủy...</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={16} />
                                        <span>Xác nhận Hủy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Demo Smart Lock Swipe RFID Modal */}
            {swipeModalBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSwipeModalBooking(null)}
                            disabled={isSwiping}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        {/* Smart Lock Reader Graphic */}
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-all duration-300 shadow-xl ${
                            swipeSuccess 
                                ? 'bg-emerald-500 text-white shadow-emerald-200 scale-105 ring-8 ring-emerald-50' 
                                : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-200 ring-8 ring-blue-50'
                        }`}>
                            {swipeSuccess ? (
                                <DoorOpen size={36} className="animate-bounce" />
                            ) : (
                                <CreditCard size={36} className={isSwiping ? 'animate-pulse' : ''} />
                            )}
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs mb-2">
                            <Radio size={14} className="animate-pulse text-blue-600" />
                            <span>Mô Phỏng Cửa Thông Minh (Smart Lock)</span>
                        </div>

                        <h3 className="text-xl font-black text-gray-900 mb-1">
                            {typeof swipeModalBooking.resourceId === 'object' ? swipeModalBooking.resourceId?.name : 'Phòng họp'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            {typeof swipeModalBooking.resourceId === 'object' ? swipeModalBooking.resourceId?.location : 'Khu vực văn phòng'}
                        </p>

                        {/* Card input & info */}
                        <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5 text-left">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                Mã thẻ RFID hoặc Email nhân viên
                            </label>
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-500 transition">
                                <CreditCard size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    value={swipeCardCode}
                                    onChange={(e) => setSwipeCardCode(e.target.value)}
                                    placeholder="RFID-1004"
                                    disabled={isSwiping || swipeSuccess}
                                    className="w-full text-xs font-mono font-bold text-gray-800 outline-none bg-transparent"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1.5">
                                Hệ thống tự động điền mã thẻ RFID của bạn. Có thể chỉnh sửa để thử nghiệm.
                            </p>
                        </div>

                        {/* Response Message */}
                        {swipeMessage && (
                            <div className={`w-full p-3 rounded-xl text-xs font-bold mb-4 animate-in fade-in ${
                                swipeSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                                {swipeSuccess ? '🟢 ' : '⚠️ '} {swipeMessage}
                            </div>
                        )}

                        <div className="flex items-center gap-3 w-full">
                            <button
                                onClick={() => setSwipeModalBooking(null)}
                                disabled={isSwiping}
                                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleExecuteSwipe}
                                disabled={isSwiping || swipeSuccess}
                                className={`flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 ${
                                    swipeSuccess 
                                        ? 'bg-emerald-600 shadow-emerald-200' 
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200 active:scale-95'
                                }`}
                            >
                                {isSwiping ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        <span>Đang đọc thẻ...</span>
                                    </>
                                ) : swipeSuccess ? (
                                    <>
                                        <CheckCircle2 size={16} />
                                        <span>Cửa Đã Mở Khóa!</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        <span>Chạm Thẻ Quẹt Ngay</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
