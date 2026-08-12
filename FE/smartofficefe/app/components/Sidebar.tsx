'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    CheckSquare,
    Package,
    BarChart3,
    User2,
    Building2,
    CreditCard,
    DollarSign,
    CalendarPlus,
    Calendar,
    Shield
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
    const router = useRouter();
    const [role, setRole] = useState<string>('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setRole(parsed.role || 'employee');
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // 1. Super Admin Menu (Platform Level)
    const superAdminMenuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Platform Dashboard', path: '/dashboard' },
        { id: 'tenants', icon: Building2, label: 'Doanh nghiệp thuê', path: '/dashboard' },
        { id: 'plans', icon: CreditCard, label: 'Quản lý Gói cước', path: '/dashboard' },
        { id: 'revenue', icon: DollarSign, label: 'Doanh thu Platform', path: '/dashboard' },
    ];

    // 2. Tenant Admin Menu (Enterprise Level)
    const adminMenuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan Doanh nghiệp', path: '/dashboard' },
        { id: 'managers-user', icon: User2, label: 'Quản lý nhân sự', path: '/dashboard/users' },
        { id: 'resources', icon: Package, label: 'Cơ sở vật chất', path: '/dashboard/resources' },
        { id: 'analytics', icon: BarChart3, label: 'Báo cáo doanh nghiệp', path: '/dashboard' },
    ];

    // 3. Manager Menu (Department Level)
    const managerMenuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan Quản lý', path: '/dashboard' },
        { id: 'approvals', icon: CheckSquare, label: 'Cổng Phê duyệt Đơn', path: '/dashboard' },
        { id: 'resources', icon: Package, label: 'Quản lý Cơ sở vật chất', path: '/dashboard/resources' },
        { id: 'analytics', icon: BarChart3, label: 'Thống kê phòng ban', path: '/dashboard' },
    ];

    // 4. Employee Menu (Individual Level)
    const employeeMenuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Bàn làm việc của tôi', path: '/dashboard' },
        { id: 'book', icon: CalendarPlus, label: 'Đặt phòng & Thiết bị', path: '/dashboard' },
        { id: 'my-bookings', icon: Calendar, label: 'Lịch cá nhân của tôi', path: '/dashboard' },
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
        <div className="w-64 bg-white h-screen flex flex-col border-r border-gray-100 sticky top-0 font-sans">
            {/* Brand Header */}
            <div className="p-6 flex items-center justify-between border-b border-gray-50 cursor-pointer" onClick={() => router.push('/dashboard')}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-100">
                        <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">SmartOffice</span>
                </div>
            </div>

            {/* Role indicator badge */}
            <div className="px-6 pt-4 pb-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border block text-center ${currentRoleConfig.badgeBg}`}>
                    {currentRoleConfig.title}
                </span>
            </div>

            {/* Dedicated Role Navigation */}
            <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto">
                {currentRoleConfig.items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Role specific Footer info */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Shield size={14} />
                    <span>Multi-Tenant Mode</span>
                </div>
            </div>
        </div>
    );
}
