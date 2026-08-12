'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import { ArrowRight, Building2, User, Mail, Lock, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Office3DScene = dynamic(() => import('../login/Office3DScene'), { ssr: false });

// Dial Configuration
const DESIGN_VARIANCE = 6;
const MOTION_INTENSITY = 4;
const VISUAL_DENSITY = 4;

const registerSchema = z.object({
  tenantName: z.string().min(2, 'Tên công ty phải từ 2 ký tự trở lên'),
  domain: z.string()
    .min(3, 'Tên miền phải từ 3 ký tự trở lên')
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Định dạng tên miền không hợp lệ (ví dụ: company.com)'),
  adminName: z.string().min(2, 'Họ tên quản trị viên phải từ 2 ký tự trở lên'),
  adminEmail: z.string().email('Địa chỉ email không hợp lệ'),
  adminPassword: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const response = await authService.registerTenant(data);
      if (response.success) {
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left side: Register Form (Light Mode) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-white">
        <div className="max-w-md w-full mx-auto">
          
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/10">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">SmartOffice</span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Đăng ký doanh nghiệp</h1>
            <p className="text-slate-500 text-sm mt-2">Khởi tạo không gian làm việc số và quản trị tài nguyên cho doanh nghiệp của bạn.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Tenant Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Tên công ty</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  {...register('tenantName')}
                  type="text"
                  placeholder="Ví dụ: Công ty cổ phần ABC"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-10 pr-4 py-2.5 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-sm"
                />
              </div>
              {errors.tenantName && (
                <p className="text-xs text-red-500 mt-1">{errors.tenantName.message}</p>
              )}
            </div>

            {/* Domain */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Tên miền doanh nghiệp</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  {...register('domain')}
                  type="text"
                  placeholder="Ví dụ: abc.com"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-10 pr-4 py-2.5 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-sm"
                />
              </div>
              {errors.domain && (
                <p className="text-xs text-red-500 mt-1">{errors.domain.message}</p>
              )}
            </div>

            <div className="h-px bg-gray-100 my-4"></div>

            {/* Admin Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Tên quản trị viên đại diện</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  {...register('adminName')}
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-10 pr-4 py-2.5 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-sm"
                />
              </div>
              {errors.adminName && (
                <p className="text-xs text-red-500 mt-1">{errors.adminName.message}</p>
              )}
            </div>

            {/* Admin Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Email đăng nhập quản trị</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  {...register('adminEmail')}
                  type="email"
                  placeholder="Ví dụ: admin@abc.com"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-10 pr-4 py-2.5 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-sm"
                />
              </div>
              {errors.adminEmail && (
                <p className="text-xs text-red-500 mt-1">{errors.adminEmail.message}</p>
              )}
            </div>

            {/* Admin Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  {...register('adminPassword')}
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 pl-10 pr-4 py-2.5 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-sm"
                />
              </div>
              {errors.adminPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.adminPassword.message}</p>
              )}
            </div>

            {/* Submit button - with tactile active scale */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-bold transition-all active:scale-[0.98] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-6 text-sm shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Đang xử lý đăng ký...
                </>
              ) : (
                <>
                  Đăng ký doanh nghiệp
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-sm text-slate-500 mt-8">
            Doanh nghiệp đã có tài khoản?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Brand Showcase (Dark Mode) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#090e17] relative overflow-hidden items-center justify-center p-16 border-l border-slate-900">
        {/* Subtle decorative mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-12 right-12 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* 3D Interactive Scene */}
        <Office3DScene />

        <div className="relative max-w-xl w-full text-white z-10 flex flex-col h-full justify-between py-8 pointer-events-none">
          {/* Top tagline */}
          <span className="text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full self-start pointer-events-auto">
            SMART OFFICE SAAS
          </span>

          {/* Main Visual Image Mockup replaced with Glowing Glassmorphism HUD */}
          <div className="my-auto py-10 relative w-full flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-blue-500/5 blur-[80px] rounded-3xl"></div>
            <div className="relative bg-slate-950/45 p-6 rounded-2xl border border-slate-800/60 shadow-2xl backdrop-blur-md max-w-sm w-full transition-all hover:border-blue-500/30 duration-500 group">
              <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-blue-500/50"></div>
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-blue-500/50"></div>
              
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800/50">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Trạng thái tài nguyên</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_8px_#06b6d4]"></div>
                    <span className="text-slate-300 font-sans">Phòng họp 102 (Lầu 1)</span>
                  </div>
                  <span className="text-xs bg-[#06b6d4]/10 text-[#22d3ee] px-2 py-0.5 rounded border border-[#06b6d4]/20 font-medium">Đang họp</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]"></div>
                    <span className="text-slate-300 font-sans">Thiết bị Studio Kit</span>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">Sẵn sàng</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]"></div>
                    <span className="text-slate-300 font-sans">Xe Camry 29A-8888</span>
                  </div>
                  <span className="text-xs bg-[#f59e0b]/10 text-[#fbbf24] px-2 py-0.5 rounded border border-[#f59e0b]/20 font-medium">Đặt lúc 14:00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div>
                    <span className="text-slate-300 font-sans">Bàn làm việc Zone A</span>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">Trống 12 bàn</span>
                </div>
              </div>
            </div>
          </div>


          {/* Bottom Features */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Tối ưu hóa tài nguyên văn phòng của bạn</h2>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="text-blue-400 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-slate-300">Quản lý phòng họp, thiết bị, xe công tác tập trung</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="text-blue-400 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-slate-300">Tự động kiểm tra xung đột lịch trình thông minh</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="text-blue-400 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-slate-300">Luồng phê duyệt yêu cầu trực quan cho Manager</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="text-blue-400 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-slate-300">Hỗ trợ đa người thuê (Multi-tenant) bảo mật</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
