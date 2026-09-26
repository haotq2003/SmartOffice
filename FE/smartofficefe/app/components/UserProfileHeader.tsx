'use client';

import React, { useEffect, useState } from 'react';
import { LogOut, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserInfo } from '../store/authSlice';
import { authService } from '../services/authService';

interface UserProfileHeaderProps {
    user?: UserInfo | null;
    defaultRole?: string;
    avatarBg?: string;
}

export default function UserProfileHeader({ user: propUser, defaultRole = 'User', avatarBg }: UserProfileHeaderProps) {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(propUser || null);

    useEffect(() => {
        if (propUser) {
            setUser(propUser);
        } else {
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setUser(parsed);
                    if (!parsed.companyName && parsed.role !== 'super_admin') {
                        authService.getMe().then((res) => {
                            if (res.success && res.data?.companyName) {
                                const updated = { ...parsed, companyName: res.data.companyName };
                                setUser(updated);
                                localStorage.setItem('user', JSON.stringify(updated));
                            }
                        }).catch(() => {});
                    }
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                }
            }
        }
    }, [propUser]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const role = user?.role || defaultRole;
    const roleColor = 
        role === 'super_admin' ? 'text-red-600 bg-red-50 border-red-100' :
        role === 'admin' ? 'text-blue-600 bg-blue-50 border-blue-100' :
        role === 'manager' ? 'text-purple-600 bg-purple-50 border-purple-100' : 
        'text-emerald-600 bg-emerald-50 border-emerald-100';

    const bgAvatar = avatarBg || (
        role === 'super_admin' ? 'bg-red-600 shadow-red-100' :
        role === 'admin' ? 'bg-blue-600 shadow-blue-100' :
        role === 'manager' ? 'bg-purple-600 shadow-purple-100' : 
        'bg-emerald-600 shadow-emerald-100'
    );

    const displayName = user?.name || (role === 'admin' ? 'Tenant Admin' : role === 'manager' ? 'Manager' : role === 'super_admin' ? 'Super Admin' : 'Nhân viên');
    const company = user?.companyName || (role === 'super_admin' ? 'Toàn hệ thống' : 'SmartOffice Corporation');

    return (
        <div className="flex items-center gap-3">
            <div className="text-right">
                <p className="text-sm font-bold text-gray-900 leading-tight">{displayName}</p>
                <div className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-gray-500 mt-1">
                    <span className="inline-flex items-center gap-1 text-slate-700 font-semibold truncate max-w-[170px]" title={`Công ty: ${company}`}>
                        <Building2 size={12} className="text-blue-600 shrink-0" />
                        <span className="truncate">{company}</span>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${roleColor}`}>
                        {role}
                    </span>
                </div>
            </div>
            <div className={`w-10 h-10 rounded-full ${bgAvatar} text-white flex items-center justify-center font-bold text-sm uppercase shadow-md shrink-0`}>
                {displayName.charAt(0)}
            </div>
            <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1 cursor-pointer"
            >
                <LogOut size={18} />
            </button>
        </div>
    );
}
