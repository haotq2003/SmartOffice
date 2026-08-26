'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import { Search, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, Loader2, X, Bell, LogOut, Package } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { bookingService } from '../../services/bookingService';
import { Resource, Booking, AvailabilitySlot } from '../../types/api';
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
    const [selectedType, setSelectedType] = useState<'all' | 'room' | 'equipment'>('all');

    const filteredResources = resources.filter((r) => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.location && r.location.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = selectedType === 'all' || r.type === selectedType;
        return matchesSearch && matchesType;
    });

    // Booking Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [borrowDate, setBorrowDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [notes, setNotes] = useState('');
    const [attendeesText, setAttendeesText] = useState('');
    const [borrowQuantity, setBorrowQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Availability state for modal
    const [occupiedSlots, setOccupiedSlots] = useState<AvailabilitySlot[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

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

    const fetchAvailability = async (resourceId: string, dateStr: string) => {
        if (!resourceId || !dateStr) return;
        setLoadingAvailability(true);
        try {
            const res = await bookingService.getAvailability(resourceId, dateStr);
            if (res.success && Array.isArray(res.data)) {
                setOccupiedSlots(res.data);
            } else {
                setOccupiedSlots([]);
            }
        } catch (err) {
            console.error('Error fetching availability:', err);
            setOccupiedSlots([]);
        } finally {
            setLoadingAvailability(false);
        }
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
        const todayStr = `${year}-${month}-${day}`;

        setStartTime(`${todayStr}T09:00`);
        setEndTime(`${todayStr}T10:00`);
        setBorrowDate(todayStr);
        setReturnDate(todayStr);
        setNotes('');
        setAttendeesText('');
        setBorrowQuantity(1);
        setIsModalOpen(true);

        if (resource.type === 'room') {
            fetchAvailability(resource._id, todayStr);
        }
    };

    const handleStartTimeChange = (newVal: string) => {
        setStartTime(newVal);
        if (selectedResource && newVal) {
            const dateStr = newVal.split('T')[0];
            fetchAvailability(selectedResource._id, dateStr);
        }
    };

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        if (!selectedResource) return;

        let startISO = '';
        let endISO = '';

        if (selectedResource.type === 'equipment') {
            if (!borrowDate || !returnDate) {
                setErrorMsg('Vui lòng chọn ngày mượn và ngày trả thiết bị.');
                return;
            }
            if (new Date(returnDate) < new Date(borrowDate)) {
                setErrorMsg('Ngày trả không được nhỏ hơn ngày mượn.');
                return;
            }
            startISO = new Date(`${borrowDate}T00:00:00.000`).toISOString();
            endISO = new Date(`${returnDate}T23:59:59.999`).toISOString();
        } else {
            if (!startTime || !endTime) {
                setErrorMsg('Vui lòng chọn thời gian bắt đầu và kết thúc.');
                return;
            }
            startISO = new Date(startTime).toISOString();
            endISO = new Date(endTime).toISOString();
        }

        setIsSubmitting(true);
        try {
            const attendeesList = selectedResource.type === 'room'
                ? attendeesText.split(',').map(item => item.trim()).filter(item => item.length > 0)
                : [];

            const formattedNotes = selectedResource.type === 'equipment'
                ? `[Số lượng mượn: ${borrowQuantity} cái] ${notes}`.trim()
                : notes;

            const res = await bookingService.createBooking({
                resourceId: selectedResource._id,
                startTime: startISO,
                endTime: endISO,
                notes: formattedNotes,
                attendees: attendeesList,
                quantity: selectedResource.type === 'equipment' ? borrowQuantity : 1,
            });

            if (res.success) {
                setSuccessMsg(selectedResource.type === 'room' ? 'Gửi yêu cầu đặt phòng họp thành công!' : 'Gửi yêu cầu mượn thiết bị thành công!');
                setIsModalOpen(false);
                fetchMyBookings();
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || 'Không thể tạo đơn đặt lịch. Vui lòng kiểm tra lại ngày.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

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
                    {/* <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Cổng Đặt Tài Nguyên Nhân Viên</h1>
                        <p className="text-gray-500 text-sm">Tra cứu và tạo yêu cầu đặt phòng họp, xe công tác và thiết bị làm việc.</p>
                    </div> */}

                    {/* {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium">
                            {successMsg}
                        </div>
                    )} */}

                    {/* Stats summary */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    </div> */}

                    {/* Filter Tabs (Manager-style Pills) */}
                    <div className="flex gap-2 mb-8 flex-wrap">
                        {[
                            { id: 'all', label: `Tất cả (${resources.length})` },
                            { id: 'room', label: `Phòng họp (${resources.filter(r => r.type === 'room').length})` },
                            { id: 'equipment', label: `Thiết bị (${resources.filter(r => r.type === 'equipment').length})` }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedType(tab.id as any)}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${selectedType === tab.id
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Resources Cards Grid */}
                    {loadingResources ? (
                        <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                            <Loader2 className="animate-spin" size={24} />
                            <span>Đang tải danh sách tài nguyên...</span>
                        </div>
                    ) : filteredResources.length === 0 ? (
                        <div className="p-12 bg-white rounded-2xl border border-gray-100 text-center text-gray-400">
                            Không tìm thấy tài nguyên nào phù hợp.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResources.map((res) => {
                                const hasImage = res.images && res.images.length > 0 && res.images[0];
                                const isAvailable = res.status === 'available';

                                return (
                                    <div key={res._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
                                        <div>
                                            {/* Image Banner */}
                                            {hasImage ? (
                                                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                                                    <img
                                                        src={res.images![0]}
                                                        alt={res.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${res.type === 'room' ? 'bg-blue-600/90 text-white' : res.type === 'vehicle' ? 'bg-purple-600/90 text-white' : 'bg-emerald-600/90 text-white'}`}>
                                                            {res.type === 'room' ? 'Phòng họp' : res.type === 'equipment' ? 'Thiết bị' : 'Phương tiện'}
                                                        </span>
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md ${res.isAutoApprove ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>
                                                            {res.isAutoApprove ? 'Tự động duyệt' : 'Cần duyệt'}
                                                        </span>
                                                    </div>
                                                    <div className="absolute top-3 right-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md ${isAvailable ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                                                            {isAvailable ? 'Sẵn sàng' : 'Bảo trì'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-6 pb-0">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${res.type === 'room' ? 'bg-blue-50 text-blue-600' : res.type === 'vehicle' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                {res.type === 'room' ? 'Phòng họp' : res.type === 'equipment' ? 'Thiết bị' : 'Phương tiện'}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${res.isAutoApprove ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {res.isAutoApprove ? 'Tự động duyệt' : 'Cần duyệt'}
                                                            </span>
                                                        </div>
                                                        <span className={`text-xs font-medium ${isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                            {isAvailable ? 'Sẵn sàng' : 'Bảo trì'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="p-5">
                                                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{res.name}</h3>

                                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                                                    <span>{res.location || (res.type === 'equipment' ? 'Phòng thiết bị' : 'Văn phòng chính')}</span>
                                                    {res.type === 'room' ? (
                                                        <span className="font-semibold text-blue-600">Sức chứa: {res.capacity || 1} người</span>
                                                    ) : (
                                                        <span className="font-semibold text-emerald-600">Số lượng: {res.quantity || 1} cái</span>
                                                    )}
                                                </div>

                                                {res.description && (
                                                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">{res.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="p-5 pt-0">
                                            <button
                                                onClick={() => handleOpenBookingModal(res)}
                                                disabled={!isAvailable}
                                                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${!isAvailable
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : res.type === 'room'
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                                                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                                                    }`}
                                            >
                                                <Plus size={16} /> {res.type === 'room' ? 'Đặt phòng họp' : 'Mượn thiết bị'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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

                        {/* Dynamic Header based on Room vs Equipment */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${selectedResource.type === 'room' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                <Package size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {selectedResource.type === 'room' ? 'Đặt phòng họp' : 'Yêu cầu mượn thiết bị'}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-semibold text-gray-700">{selectedResource.name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${selectedResource.isAutoApprove ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {selectedResource.isAutoApprove ? 'Tự động duyệt' : 'Cần duyệt'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Equipment Notice */}
                        {selectedResource.type === 'equipment' && (
                            <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                                <div>
                                    <p className="font-bold">Quy trình mượn thiết bị:</p>
                                    <p className="text-[11px] text-emerald-700 mt-0.5">Đơn mượn sẽ được gửi tới Manager duyệt. Sau khi duyệt, vui lòng tới <span className="font-bold">{selectedResource.location || 'Kho thiết bị'}</span> để nhận đồ.</p>
                                </div>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                                {errorMsg}
                            </div>
                        )}

                        {/* Occupied Slots Preview (ONLY for Meeting Rooms) */}
                        {selectedResource.type === 'room' && (
                            <div className="mb-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                        <Clock size={14} className="text-amber-600" /> Khung giờ đã có người đặt trong ngày:
                                    </span>
                                    {loadingAvailability && <Loader2 className="animate-spin text-amber-600" size={14} />}
                                </div>

                                {occupiedSlots.length === 0 ? (
                                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                                        <CheckCircle2 size={13} /> Chưa có ai đặt trong ngày này. Tất cả khung giờ đều sẵn sàng!
                                    </p>
                                ) : (
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                        {occupiedSlots.map((slot, idx) => {
                                            const sTime = new Date(slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                            const eTime = new Date(slot.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                                            return (
                                                <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-amber-200/50 shadow-2xs">
                                                    <span className="font-bold text-red-600">
                                                        {sTime} - {eTime}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                                        {slot.status === 'checked_in' ? 'Đã giao thiết bị' : slot.status === 'approved' ? 'Đã duyệt' : 'Đang chờ duyệt'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleCreateBooking} className="space-y-4">
                            {/* Equipment Quantity Selection */}
                            {selectedResource.type === 'equipment' && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-gray-700">Số lượng cần mượn</label>
                                        <span className="text-[11px] font-semibold text-emerald-600">Kho còn: {selectedResource.quantity || 1} cái</span>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={selectedResource.quantity || 1}
                                        value={borrowQuantity}
                                        onChange={(e) => setBorrowQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-emerald-600 outline-none transition-all font-bold"
                                        required
                                    />
                                </div>
                            )}

                            {/* Equipment Date-only pickers vs Room Datetime-local pickers */}
                            {selectedResource.type === 'equipment' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Ngày mượn</label>
                                        <input
                                            type="date"
                                            value={borrowDate}
                                            onChange={(e) => setBorrowDate(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 focus:bg-white focus:border-emerald-600 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Ngày trả (dự kiến)</label>
                                        <input
                                            type="date"
                                            value={returnDate}
                                            min={borrowDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 focus:bg-white focus:border-emerald-600 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Thời gian bắt đầu (08:00 - 17:30)</label>
                                        <input
                                            type="datetime-local"
                                            value={startTime}
                                            onChange={(e) => handleStartTimeChange(e.target.value)}
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
                                </>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    {selectedResource.type === 'equipment' ? 'Địa điểm & Mục đích sử dụng' : 'Mục đích / Ghi chú cuộc họp'}
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder={selectedResource.type === 'equipment' ? "Ví dụ: Dùng tại Sảnh tầng 1 cho sự kiện workshop Marketing..." : "Ví dụ: Họp báo cáo kiến trúc dự án Phoenix với 5 thành viên..."}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                />
                            </div>

                            {/* Attendees input ONLY for Meeting Rooms */}
                            {selectedResource.type === 'room' && (
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
                            )}

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
                                    className={`flex-1 py-2.5 text-white rounded-xl font-bold text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${selectedResource.type === 'equipment' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                                        }`}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : selectedResource.type === 'equipment' ? 'Gửi yêu cầu mượn' : 'Gửi yêu cầu đặt phòng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
