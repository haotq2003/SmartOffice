'use client';

import React from 'react';
import Navbar from './components/Navbar';
import { 
    Calendar, 
    ShieldCheck, 
    BarChart2, 
    ArrowRight, 
    Building2, 
    Laptop, 
    Car, 
    CheckCircle2, 
    Globe, 
    Check,
    Sparkles,
    Package,
    Layers,
    Zap,
    Activity,
    Shield,
    Smartphone
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  const handleRegisterRedirect = () => {
    router.push('/register');
  };

  const CLIENT_LOGOS = [
    { name: 'FPT SOFTWARE', icon: <Building2 size={20} className="text-blue-600 shrink-0" /> },
    { name: 'VINGROUP ECOSYSTEM', icon: <Sparkles size={20} className="text-emerald-600 shrink-0" /> },
    { name: 'VIETTEL TELECOM', icon: <Globe size={20} className="text-red-600 shrink-0" /> },
    { name: 'SHOPEE VIETNAM', icon: <Package size={20} className="text-amber-500 shrink-0" /> },
    { name: 'MISA JOINT STOCK', icon: <Layers size={20} className="text-indigo-600 shrink-0" /> },
    { name: 'TIKI CORPORATION', icon: <Zap size={20} className="text-cyan-500 shrink-0" /> },
    { name: 'TECHCOMBANK', icon: <Shield size={20} className="text-rose-600 shrink-0" /> },
    { name: 'VNG CORPORATION', icon: <Activity size={20} className="text-purple-600 shrink-0" /> },
  ];

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 selection:bg-slate-900 selection:text-white overflow-x-hidden">
      <Navbar onLoginClick={handleLoginRedirect} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          
          {/* Left Hero Text */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Multi-Tenant Workspace Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Hệ Thống Quản Trị <br />
              <span className="text-blue-600">Văn Phòng Số</span> & Tài Nguyên
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed mx-auto lg:mx-0 font-normal">
              Nền tảng SaaS quản lý tập trung đặt lịch phòng họp, mượn thiết bị kho, điều xe công tác và bảo mật mở cửa tự động toàn doanh nghiệp.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={handleRegisterRedirect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                Đăng Ký Doanh Nghiệp
                <ArrowRight size={16} />
              </button>

              <button
                onClick={handleLoginRedirect}
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Đăng Nhập Hệ Thống
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600" /> Khởi tạo công ty 30s
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600" /> Miễn phí trải nghiệm
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600" /> Bảo mật cách ly Tenant
              </span>
            </div>
          </div>

          {/* Right Sleek Preview Mockup */}
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
            <div className="bg-slate-950 p-6 sm:p-7 rounded-2xl shadow-2xl border border-slate-800 text-white font-mono text-xs">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800 text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="ml-2 text-[11px] font-sans text-slate-400">SmartOffice Control Hub</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-sans font-semibold">● Live Systems</span>
              </div>

              {/* Minimal Clean HUD Items */}
              <div className="space-y-3 font-sans">
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Phòng Họp VIP A (Lầu 4)</p>
                      <p className="text-[11px] text-slate-400">09:30 - 11:00 (Họp Ban Giám Đốc)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                    Đã Xác Nhận
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Laptop size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Camera Sony 4K FX3</p>
                      <p className="text-[11px] text-slate-400">Mượn theo ngày (Đã bàn giao kho)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    Kho -1
                  </span>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Car size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Xe Camry 2.5Q (Công tác)</p>
                      <p className="text-[11px] text-slate-400">14:00 - 17:30 (Đón đối tác)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                    Chờ Duyệt
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Endless Marquee Logo Loop */}
      <section className="py-8 border-b border-slate-100 bg-slate-50/50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 text-center mb-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Được Tin Dùng Bởi Hơn 500+ Doanh Nghiệp Hàng Đầu
          </p>
        </div>

        {/* Infinite CSS Marquee Slider */}
        <div className="relative w-full overflow-hidden py-3">
          {/* Gradient Edge Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

          <div className="flex items-center gap-12 sm:gap-20 animate-marquee whitespace-nowrap">
            {CLIENT_LOGOS.concat(CLIENT_LOGOS).map((logo, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-xl border border-slate-200/60 shadow-sm opacity-80 hover:opacity-100 hover:border-slate-300 transition-all shrink-0 cursor-default"
              >
                {logo.icon}
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-800">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
            Tính Năng Nền Tảng
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Tập Trung Toàn Bộ Văn Phòng
          </h2>
        </div>

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Đặt Phòng Họp & Xe Công Tác',
              icon: Calendar,
              desc: 'Đặt lịch theo giờ làm việc (08:00 - 17:30). Tự động kiểm tra phát hiện trùng lịch trình cá nhân.'
            },
            {
              title: 'Mượn Thiết Bị Kho Theo Ngày',
              icon: Laptop,
              desc: 'Quản lý mượn thiết bị theo ngày, tự động trừ tồn kho khi Manager bàn giao và khôi phục khi nhận lại.'
            },
            {
              title: 'Tự Động Hóa Thông Báo Trễ Hạn',
              icon: ShieldCheck,
              desc: 'Hệ thống Cron Worker chạy ngầm gửi cảnh báo nhắc nhở khi thiết bị kho mượn quá ngày quy định.'
            },
            {
              title: 'Luồng Phê Duyệt Manager',
              icon: ShieldCheck,
              desc: 'Giao diện tập trung dành cho Manager duyệt đơn mượn, báo vi phạm No-Show và xác nhận giao nhận đồ.'
            },
            {
              title: 'Báo Cáo Analytics Doanh Nghiệp',
              icon: BarChart2,
              desc: 'Thống kê công suất lấp đầy phòng họp, biểu đồ mật độ khung giờ cao điểm và top tài nguyên mượn nhiều nhất.'
            },
            {
              title: 'Kiến Trúc SaaS Multi-Tenant',
              icon: Globe,
              desc: 'Mỗi doanh nghiệp thuê có không gian dữ liệu riêng biệt. Hỗ trợ phân quyền Super Admin, Tenant Admin, Manager & Employee.'
            }
          ].map((feat, idx) => (
            <div key={idx} className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center mb-5">
                <feat.icon size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clean Pricing Section */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
            Gói Dịch Vụ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Bảng Giá Đăng Ký SaaS
          </h2>
        </div>

        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Free</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">Gói Trải Nghiệm</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-slate-900">$0</span>
                <span className="text-xs text-slate-500">/ tháng</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 mb-8">
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Tối đa 20 Nhân viên</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Tối đa 5 Tài nguyên</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Đặt phòng họp theo giờ</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Mượn thiết bị kho</li>
              </ul>
            </div>
            <button
              onClick={handleRegisterRedirect}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Đăng Ký Miễn Phí
            </button>
          </div>

          {/* Premium */}
          <div className="bg-white p-7 rounded-2xl border-2 border-blue-600 shadow-md flex flex-col justify-between relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-0.5 rounded-full tracking-wider">
              Khuyên Dùng
            </span>
            <div>
              <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">Premium</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">Gói Chuyên Nghiệp</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-slate-900">$49</span>
                <span className="text-xs text-slate-500">/ tháng</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 mb-8">
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Tối đa 100 Nhân viên</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Tối đa 25 Tài nguyên</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Thông báo trễ hạn (Cron Worker)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Quản lý xe công tác tập trung</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Hỗ trợ 24/7</li>
              </ul>
            </div>
            <button
              onClick={handleRegisterRedirect}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Dùng Thử Premium
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-950 p-7 rounded-2xl border border-slate-800 text-white shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Enterprise</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-3">Gói Tập Đoàn</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-white">$199</span>
                <span className="text-xs text-slate-400">/ tháng</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Không giới hạn Nhân viên</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Không giới hạn Tài nguyên</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Báo cáo Analytics chuyên sâu</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Tích hợp Subdomain riêng</li>
              </ul>
            </div>
            <button
              onClick={handleRegisterRedirect}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Liên Hệ Đăng Ký
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-14 pb-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-slate-900 text-white font-bold rounded-lg flex items-center justify-center text-[10px]">
              SO
            </div>
            <span className="font-bold text-slate-900">SmartOffice SaaS Platform</span>
            <span>© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-slate-900">Đăng Nhập</Link>
            <Link href="/register" className="hover:text-slate-900">Đăng Ký Doanh Nghiệp</Link>
          </div>
        </div>
      </footer>

      {/* Global CSS for Marquee Animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
