'use client';

import React, { useState, useEffect } from 'react';
import EmployeeDashboardPage from './employee/page';
import ManagerDashboardPage from './manager/page';
import AdminDashboardPage from './admin/page';
import SuperAdminDashboardPage from './super-admin/page';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setRole(parsed.role || 'employee');
            } catch (e) {
                console.error('Failed to parse user from localStorage:', e);
                setRole('employee');
            }
        } else {
            setRole('employee');
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 gap-2 font-sans">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <span>Đang nạp bảng điều khiển...</span>
            </div>
        );
    }

    // Role-based 4 Dashboard Router
    switch (role) {
        case 'super_admin':
            return <SuperAdminDashboardPage />;
        case 'admin':
            return <AdminDashboardPage />;
        case 'manager':
            return <ManagerDashboardPage />;
        case 'employee':
        default:
            return <EmployeeDashboardPage />;
    }
}
