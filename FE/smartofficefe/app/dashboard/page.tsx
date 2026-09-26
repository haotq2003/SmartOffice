'use client';

import React, { useState, useEffect } from 'react';
import EmployeeDashboardPage from './employee/page';
import ManagerDashboardPage from './manager/page';
import AdminDashboardPage from './admin/page';
import SuperAdminDashboardPage from './super-admin/page';
import apiClient from '../services/apiClient';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, LogOut, RefreshCw, Building2 } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string>('');
    const [isSubscribed, setIsSubscribed] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);

    const checkSubscription = async (userRole: string) => {
        if (userRole === 'super_admin') {
            setIsSubscribed(true);
            setLoading(false);
            return;
        }

        try {
            const res = await apiClient.get('/tenants/me');
            if (res.data?.success && res.data?.data) {
                const tData = res.data.data;
                setCompanyName(tData.name || '');
                setIsSubscribed(!!tData.isSubscribed);
            }
        } catch (e: any) {
            console.warn('Check tenant subscription error:', e);
            if (e.response?.status === 403 || e.response?.data?.requiresSubscription) {
                setIsSubscribed(false);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                const r = parsed.role || 'employee';
                setRole(r);
                setCompanyName(parsed.companyName || '');
                checkSubscription(r);
            } catch (e) {
                console.error('Failed to parse user from localStorage:', e);
                setRole('employee');
                checkSubscription('employee');
            }
        } else {
            setRole('employee');
            checkSubscription('employee');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 gap-2 font-sans">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <span>Đang nạp bảng điều khiển...</span>
            </div>
        );
    }

    // Role-based 4 Dashboard Router
    if (role === 'super_admin') {
        return <SuperAdminDashboardPage />;
    }

    if (role === 'admin') {
        return <AdminDashboardPage />;
    }

    // If company has not paid, block employee and manager access with friendly screen
    if (!isSubscribed) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-slate-100 flex items-center justify-center p-6 font-sans">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-lg w-full p-8 text-center space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                        <ShieldAlert size={36} />
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                            Chưa Kích Hoạt Gói Cước
                        </span>
                        <h1 className="text-2xl font-black text-gray-900 pt-1">Hệ Thống Đang Tạm Khóa</h1>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Doanh nghiệp <span className="font-bold text-gray-900">{companyName || 'của bạn'}</span> chưa đăng ký hoặc chưa gia hạn gói cước dịch vụ SmartOffice.
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-left text-xs text-gray-600 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <Building2 size={16} className="text-blue-600" />
                            <span>Hướng dẫn tiếp tục:</span>
                        </div>
                        <p className="leading-relaxed">
                            Vui lòng liên hệ <span className="font-bold text-blue-600">Quản trị viên (Admin)</span> của doanh nghiệp bạn để chọn gói dịch vụ và thanh toán qua MoMo / VNPay để kích hoạt hệ thống cho toàn bộ nhân sự.
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                            onClick={() => {
                                setLoading(true);
                                checkSubscription(role || 'employee');
                            }}
                            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <RefreshCw size={15} /> Kiểm tra lại
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <LogOut size={15} /> Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (role === 'manager') {
        return <ManagerDashboardPage />;
    }

    return <EmployeeDashboardPage />;
}
