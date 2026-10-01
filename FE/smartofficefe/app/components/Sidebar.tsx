'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import {
    LayoutDashboard,
    CheckSquare,
    Package,
    BarChart3,
    User2,
    Building2,
    CreditCard,
    DollarSign,
    Calendar,
    Shield,
    KeyRound
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
    const router = useRouter();
    const [role, setRole] = useState<string>('');
    const [companyName, setCompanyName] = useState<string>('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setRole(parsed.role || 'employee');
                if (parsed.companyName) {
                    setCompanyName(parsed.companyName);
                } else if (parsed.role === 'super_admin') {
                    setCompanyName('Hệ thống SmartOffice');
                } else {
                    authService.getMe().then((res) => {
                        if (res.success && res.data?.companyName) {
                            setCompanyName(res.data.companyName);
                            localStorage.setItem('user', JSON.stringify({ ...parsed, companyName: res.data.companyName }));
                        }
                    }).catch(() => {});
                }
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // 1. Super Admin Menu (Platform Level)
    const superAdminMenuItems = [
        { id: 'dashboard', icon: Building2, label: 'Quản Lý Doanh Nghiệp', path: '/dashboard' },
        { id: 'super-admin-users', icon: User2, label: 'Quản Lý Tất Cả Tài Khoản', path: '/dashboard/super-admin/users' },
        { id: 'plans', icon: CreditCard, label: 'Quản Lý Gói Cước', path: '/dashboard/plans' },
        { id: 'revenue', icon: DollarSign, label: 'Doanh Thu Platform', path: '/dashboard/revenue' },
    ];

    // 2. Tenant Admin Menu (Enterprise Level)
    const adminMenuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng Quan Doanh Nghiệp', path: '/dashboard' },
        { id: 'managers-user', icon: User2, label: 'Quản Lý Nhân Sự', path: '/dashboard/users' },
        { id: 'resources', icon: Package, label: 'Cơ Sở Vật Chất', path: '/dashboard/resources' },
        { id: 'door-simulator', icon: KeyRound, label: 'Mô Phỏng Quẹt Cửa', path: '/door-simulator' },
        { id: 'analytics', icon: BarChart3, label: 'Báo Cáo Doanh Nghiệp', path: '/dashboard/analytics' },
    ];

    // 3. Manager Menu (Department Level)
    const managerMenuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Phê Duyệt Đơn', path: '/dashboard' },
        
    ];

    // 4. Employee Menu (Individual Level)
    const employeeMenuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Đặt Phòng & Thiết Bị', path: '/dashboard' },
        { id: 'my-bookings', icon: Calendar, label: 'Lịch Sử Đặt Lịch', path: '/dashboard/my-bookings' },
    ];

    // Select specific menu for active role
    const getMenuItems = () => {
        switch (role) {
            case 'super_admin':
                return { items: superAdminMenuItems, title: 'SUPER ADMIN PORTAL', badgeBg: 'bg-red-50 text-red-600 border-red-100' };
            case 'admin':
                return { items: adminMenuItems, title: 'TENANT ADMIN', badgeBg: 'bg-blue-50 text-blue-600 border-blue-100' };
            case 'manager':
                return { items: managerMenuItems, title: 'MANAGER WORKSPACE', badgeBg: 'bg-purple-50 text-purple-600 border-purple-100' };
            default:
                return { items: employeeMenuItems, title: 'EMPLOYEE PORTAL', badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
        }
    };

    const currentRoleConfig = getMenuItems();

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    return (
        <aside className="w-64 shrink-0 bg-white h-screen flex flex-col border-r border-gray-100 sticky top-0 font-sans select-none">
            {/* Brand Header */}
            <div className="p-6 flex items-center justify-between border-b border-gray-50 cursor-pointer" onClick={() => router.push('/dashboard')}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-100">
                        <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">SmartOffice</span>
                </div>
            </div>

            {/* Role indicator badge */}
            <div className="px-5 pt-3 pb-1">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border block text-center whitespace-nowrap overflow-hidden truncate ${currentRoleConfig.badgeBg}`}>
                    {currentRoleConfig.title}
                </span>
            </div>

            {/* Company / Doanh nghiệp Badge Card */}
            {companyName && (
                <div className="px-4 pt-1 pb-2">
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:bg-slate-100/80 transition-colors shadow-2xs">
                        <div className="w-7 h-7 rounded-lg bg-blue-100/90 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
                            <Building2 size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block leading-tight">Công ty</span>
                            <span className="text-xs font-bold text-gray-800 truncate block leading-tight mt-0.5" title={companyName}>
                                {companyName}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Dedicated Role Navigation */}
            <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto">
                {currentRoleConfig.items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left whitespace-nowrap overflow-hidden ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <item.icon size={18} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Role specific Footer info */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium whitespace-nowrap overflow-hidden">
                    <Shield size={14} className="shrink-0 text-blue-600" />
                    <span className="truncate font-semibold text-gray-600" title={companyName || 'Multi-Tenant Mode'}>
                        {companyName || 'Multi-Tenant Mode'}
                    </span>
                </div>
            </div>
        </aside>
    );
}
