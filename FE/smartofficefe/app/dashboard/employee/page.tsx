'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { Search, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, Loader2, X, Bell, LogOut, Package } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { bookingService } from '../../services/bookingService';
import { Resource, Booking } from '../../types/api';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

export default function EmployeeDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [loadingResources, setLoadingResources] = useState(true);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    
    // Booking Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [attendeesText, setAttendeesText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        fetchResources();
        fetchMyBookings();
    };

    const fetchResources = async () => {
        setLoadingResources(true);
        try {
            const res = await resourceService.getAllResources();
            if (res.success && Array.isArray(res.data)) {
                setResources(res.data);
            }
        } catch (err) {
            console.error('Error fetching resources:', err);
        } finally {
            setLoadingResources(false);
        }
    };

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

    const handleOpenBookingModal = (resource: Resource) => {
        setSelectedResource(resource);
        setErrorMsg(null);
        setSuccessMsg(null);
        
        // Default start time: Today 09:00, End time: Today 10:00
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        setStartTime(`${year}-${month}-${day}T09:00`);
        setEndTime(`${year}-${month}-${day}T10:00`);
        setNotes('');
        setAttendeesText('');
        setIsModalOpen(true);
    };

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        if (!selectedResource || !startTime || !endTime) {
            setErrorMsg('Vui lòng chọn thời gian bắt đầu và kết thúc.');
            return;
        }

        setIsSubmitting(true);
        try {
            const attendeesList = attendeesText
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);

            const res = await bookingService.createBooking({
                resourceId: selectedResource._id,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                notes,
                attendees: attendeesList,
            });

            if (res.success) {
                setSuccessMsg('Gửi yêu cầu đặt tài nguyên thành công!');
                setIsModalOpen(false);
                fetchMyBookings();
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || 'Không thể tạo đơn đặt lịch. Vui lòng kiểm tra lại khung giờ.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const filteredResources = resources.filter((r) => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.location && r.location.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = selectedType === 'all' || r.type === selectedType;
        return matchesSearch && matchesType;
    });

    const pendingCount = myBookings.filter(b => b.status === 'pending').length;
    const approvedCount = myBookings.filter(b => b.status === 'approved').length;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="dashboard" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm phòng họp, thiết bị, xe công tác..."
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
                                <p className="text-sm font-bold text-gray-900">{user?.name || 'Employee'}</p>
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
                    {/* Welcome banner */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Cổng Đặt Tài Nguyên Nhân Viên</h1>
                        <p className="text-gray-500 text-sm">Tra cứu và tạo yêu cầu đặt phòng họp, xe công tác và thiết bị làm việc.</p>
                    </div>

                    {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium">
                            {successMsg}
                        </div>
                    )}

                    {/* Stats summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng lịch của tôi</p>
                                <p className="text-2xl font-extrabold text-gray-900">{myBookings.length}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đơn chờ duyệt</p>
                                <p className="text-2xl font-extrabold text-gray-900">{pendingCount}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đã được duyệt</p>
                                <p className="text-2xl font-extrabold text-gray-900">{approvedCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Resource Booking Cards */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Danh sách Tài nguyên Văn phòng</h2>
                            <div className="flex gap-2">
                                {[
                                    { label: 'Tất cả', value: 'all' },
                                    { label: 'Phòng họp', value: 'room' },
                                    { label: 'Xe công tác', value: 'vehicle' },
                                    { label: 'Thiết bị', value: 'equipment' }
                                ].map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setSelectedType(tab.value)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${selectedType === tab.value
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loadingResources ? (
                            <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                                <Loader2 className="animate-spin" size={24} />
                                <span>Đang tải danh sách tài nguyên...</span>
                            </div>
                        ) : filteredResources.length === 0 ? (
                            <div className="p-12 bg-white rounded-2xl border border-gray-100 text-center text-gray-400">
                                Không có tài nguyên nào phù hợp.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredResources.map((res) => (
                                    <div key={res._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${res.type === 'room' ? 'bg-blue-50 text-blue-600' : res.type === 'vehicle' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {res.type}
                                                </span>
                                                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sẵn sàng
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{res.name}</h3>
                                            <p className="text-xs text-gray-400 mb-4">{res.location || 'Văn phòng chính'} • Sức chứa: {res.capacity || 1} người</p>
                                            {res.description && (
                                                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{res.description}</p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleOpenBookingModal(res)}
                                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-100"
                                        >
                                            <Plus size={16} /> Đặt ngay
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Personal Booking History */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Lịch sử Đặt lịch của Tôi</h2>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {loadingBookings ? (
                                <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>Đang tải lịch sử...</span>
                                </div>
                            ) : myBookings.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    Bạn chưa tạo đơn đặt lịch nào.
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
                                        {myBookings.map((b) => {
                                            const resourceObj = typeof b.resourceId === 'object' ? b.resourceId : null;
                                            return (
                                                <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-6 font-semibold text-gray-900">
                                                        {resourceObj?.name || 'Tài nguyên'}
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
                </div>
            </main>

            {/* Booking Modal */}
            {isModalOpen && selectedResource && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <Package size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Đặt tài nguyên</h3>
                                <p className="text-xs text-gray-500">{selectedResource.name}</p>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleCreateBooking} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Thời gian bắt đầu (08:00 - 17:30)</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Thời gian kết thúc</label>
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Mục đích / Ghi chú</label>
                                <textarea
                                    rows={3}
                                    placeholder="Ví dụ: Họp báo cáo kiến trúc dự án Phoenix với 5 thành viên..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Mời đồng nghiệp (Email người tham dự)</label>
                                <input
                                    type="text"
                                    placeholder="alex@company.com, sarah@company.com"
                                    value={attendeesText}
                                    onChange={(e) => setAttendeesText(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Phân cách các email bởi dấu phẩy (,). Hệ thống sẽ gửi email thư mời họp tới các đồng nghiệp này.</p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Gửi yêu cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
