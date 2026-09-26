'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import UserProfileHeader from '../../components/UserProfileHeader';
import { 
    BarChart3, 
    TrendingUp, 
    Calendar, 
    Building, 
    Laptop, 
    Car, 
    Download, 
    CheckCircle2, 
    Clock, 
    PieChart,
    LogOut,
    Search
} from 'lucide-react';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

export default function AnalyticsDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const handleExportReport = () => {
        alert('Hệ thống đang xuất file Báo cáo Thống kê Doanh nghiệp (.xlsx)...');
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="analytics" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm chỉ số báo cáo, hiệu suất sử dụng..."
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

                {/* Main Content Area */}
                <div className="p-8">
                    {/* Title & Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold mb-2">
                                <BarChart3 size={14} /> Analytics & Intelligence Report
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Báo Cáo Thống Kê Doanh Nghiệp</h1>
                            <p className="text-gray-500 text-xs">Phân tích hiệu suất lấp đầy phòng họp, tần suất mượn thiết bị & xu hướng vận hành.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Time range selector */}
                            <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center shadow-sm">
                                <button
                                    onClick={() => setTimeRange('week')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Tuần này
                                </button>
                                <button
                                    onClick={() => setTimeRange('month')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Tháng này
                                </button>
                                <button
                                    onClick={() => setTimeRange('quarter')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${timeRange === 'quarter' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Quý này
                                </button>
                            </div>

                            <button
                                onClick={handleExportReport}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-100 cursor-pointer"
                            >
                                <Download size={16} /> Xuất Báo Cáo
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng Lượt Đặt</span>
                                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                    <Calendar size={20} />
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">248</h3>
                                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <TrendingUp size={14} /> +18.4% <span className="text-gray-400 font-normal">so với tháng trước</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Công Suất Phòng Họp</span>
                                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                    <Building size={20} />
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">78.5%</h3>
                                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <TrendingUp size={14} /> +5.2% <span className="text-gray-400 font-normal">tỷ lệ lấp đầy</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tỷ Lệ Duyệt Đơn</span>
                                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 size={20} />
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">94.2%</h3>
                                <p className="text-xs text-gray-400">233/248 đơn đã duyệt & bàn giao</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Thiết Bị Đang Mượn</span>
                                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                    <Laptop size={20} />
                                </span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-extrabold text-amber-600 mb-1">12 cái</h3>
                                <p className="text-xs text-gray-400">0 đơn trễ hạn (Kho tối ưu)</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section 1: Bar Chart Trend & Category Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Monthly Bar Chart Trend */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Xu Hướng Đặt Lịch Theo Tuần trong Tháng</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">So sánh lượt đặt Phòng họp, Thiết bị & Xe công tác qua 4 tuần.</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                                            <span className="text-gray-600">Phòng họp</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                            <span className="text-gray-600">Thiết bị</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                            <span className="text-gray-600">Xe công tác</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Responsive Bar Chart Visualizer */}
                                <div className="h-64 flex items-end justify-between gap-6 px-4 border-b border-gray-100 pb-4">
                                    {/* Week 1 */}
                                    <div className="flex-1 flex items-end justify-center gap-2 h-full">
                                        <div className="w-1/3 bg-blue-600 rounded-t-lg h-[45%] relative group transition-all hover:bg-blue-700">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">45</span>
                                        </div>
                                        <div className="w-1/3 bg-emerald-500 rounded-t-lg h-[30%] relative group transition-all hover:bg-emerald-600">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">30</span>
                                        </div>
                                        <div className="w-1/3 bg-purple-500 rounded-t-lg h-[15%] relative group transition-all hover:bg-purple-600">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">15</span>
                                        </div>
                                    </div>

                                    {/* Week 2 */}
                                    <div className="flex-1 flex items-end justify-center gap-2 h-full">
                                        <div className="w-1/3 bg-blue-600 rounded-t-lg h-[65%] relative group transition-all hover:bg-blue-700">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">65</span>
                                        </div>
                                        <div className="w-1/3 bg-emerald-500 rounded-t-lg h-[40%] relative group transition-all hover:bg-emerald-600">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">40</span>
                                        </div>
                                        <div className="w-1/3 bg-purple-500 rounded-t-lg h-[20%] relative group transition-all hover:bg-purple-600">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">20</span>
                                        </div>
                                    </div>

                                    {/* Week 3 */}
                                    <div className="flex-1 flex items-end justify-center gap-2 h-full">
                                        <div className="w-1/3 bg-blue-600 rounded-t-lg h-[85%] relative group transition-all hover:bg-blue-700">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">85</span>
                                        </div>
                                        <div className="w-1/3 bg-emerald-500 rounded-t-lg h-[50%] relative group transition-all hover:bg-emerald-600">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">50</span>
                                        </div>
                                        <div className="w-1/3 bg-purple-500 rounded-t-lg h-[25%] relative group transition-all hover:bg-purple-600">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">25</span>
                                        </div>
                                    </div>

                                    {/* Week 4 (Current) */}
                                    <div className="flex-1 flex items-end justify-center gap-2 h-full">
                                        <div className="w-1/3 bg-blue-600 rounded-t-lg h-[70%] relative group transition-all hover:bg-blue-700">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">70</span>
                                        </div>
                                        <div className="w-1/3 bg-emerald-500 rounded-t-lg h-[45%] relative group transition-all hover:bg-emerald-600">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">45</span>
                                        </div>
                                        <div className="w-1/3 bg-purple-500 rounded-t-lg h-[18%] relative group transition-all hover:bg-purple-600">
                                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gray-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">18</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between text-xs font-bold text-gray-500 pt-3 px-4 text-center">
                                    <span className="flex-1">Tuần 1</span>
                                    <span className="flex-1">Tuần 2</span>
                                    <span className="flex-1">Tuần 3</span>
                                    <span className="flex-1">Tuần 4 (Hiện tại)</span>
                                </div>
                            </div>
                        </div>

                        {/* Peak Working Hours Heatmap */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <Clock size={18} className="text-blue-600" />
                                        Khung Giờ Đặt Cao Điểm
                                    </h3>
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">8h00 - 17h30</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-6">Mật độ sử dụng phòng họp theo từng khung giờ trong ngày.</p>

                                <div className="space-y-4">
                                    {[
                                        { time: '08:00 - 09:30', percent: 45, label: 'Trung bình', color: 'bg-blue-400' },
                                        { time: '09:30 - 11:00', percent: 92, label: 'Rất Cao (Peak)', color: 'bg-red-500' },
                                        { time: '11:00 - 13:30', percent: 15, label: 'Nghỉ trưa', color: 'bg-gray-300' },
                                        { time: '13:30 - 15:00', percent: 85, label: 'Cao', color: 'bg-amber-500' },
                                        { time: '15:00 - 17:00', percent: 68, label: 'Khá cao', color: 'bg-blue-600' },
                                    ].map((slot, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-gray-700">{slot.time}</span>
                                                <span className="text-gray-900 font-extrabold">{slot.percent}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                                <div className={`${slot.color} h-full rounded-full transition-all duration-500`} style={{ width: `${slot.percent}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                                💡 <strong>Gợi ý:</strong> Khung giờ <strong>09h30 - 11h00</strong> luôn bị quá tải. Nên khuyến khích nhân viên đặt phòng trước 1-2 ngày.
                            </div>
                        </div>
                    </div>

                    {/* Chart Section 2: Top Utilized Resources Leaderboard */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Bảng Xếp Hạng Tài Nguyên Được Đăng Ký Nhiều Nhất</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Top phòng họp, xe công tác và thiết bị có tần suất khai thác cao nhất.</p>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Top 5 tài nguyên Hot</span>
                        </div>

                        <div className="space-y-4">
                            {[
                                { rank: 1, name: 'Phòng Họp VIP A (Lầu 4)', type: 'room', count: 48, totalDays: '72 giờ họp', percent: 88, color: 'bg-blue-600' },
                                { rank: 2, name: 'Camera 4K Cinema Sony FX3', type: 'equipment', count: 28, totalDays: '14 ngày mượn', percent: 75, color: 'bg-emerald-500' },
                                { rank: 3, name: 'Xe Sedan Toyota Camry 2.5Q', type: 'vehicle', count: 19, totalDays: '38 chuyến đi', percent: 62, color: 'bg-purple-600' },
                                { rank: 4, name: 'Phòng Creative Lab (Tầng 2)', type: 'room', count: 24, totalDays: '36 giờ họp', percent: 55, color: 'bg-blue-500' },
                                { rank: 5, name: 'Laptop Dell XPS 15 9530', type: 'equipment', count: 15, totalDays: '9 ngày mượn', percent: 42, color: 'bg-emerald-400' },
                            ].map((item) => (
                                <div key={item.rank} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50/70 border border-gray-50 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-white shrink-0 ${
                                        item.rank === 1 ? 'bg-amber-500 shadow-md shadow-amber-200' :
                                        item.rank === 2 ? 'bg-slate-400' :
                                        item.rank === 3 ? 'bg-amber-700' : 'bg-gray-300'
                                    }`}>
                                        #{item.rank}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                                            <span className="text-xs font-extrabold text-gray-700">{item.count} lượt mượn <span className="text-gray-400 font-normal">({item.totalDays})</span></span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
