'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { Search, UserPlus, Shield, UserCheck, Mail, Lock, Loader2, X, Bell, LogOut } from 'lucide-react';
import { authService } from '../../services/authService';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'employee' | 'super_admin';
    createdAt?: string;
}

export default function UsersPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const handleLogout = () => {
        
        router.push('/login');
    };
    // Form state for creating user
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee' as 'manager' | 'employee',
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user from localStorage', e);
            }
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await authService.getUsers();
            if (res.success && Array.isArray(res.data)) {
                setUsers(res.data);
            }
        } catch (err: any) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        if (!formData.name || !formData.email || !formData.password) {
            setErrorMsg('Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await authService.createUser(formData);
            if (res.success) {
                setSuccessMsg('Tạo tài khoản thành công!');
                setFormData({ name: '', email: '', password: '', role: 'employee' });
                setIsModalOpen(false);
                fetchUsers();
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || 'Tạo tài khoản thất bại. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole === 'all' || u.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    const totalManagers = users.filter((u) => u.role === 'manager').length;
    const totalEmployees = users.filter((u) => u.role === 'employee').length;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="managers-user" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhân sự theo tên hoặc email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <button className="relative text-gray-400 hover:text-gray-900 transition-colors">
                            <Bell size={24} />
                        </button>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{currentUser?.name || 'User'}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{currentUser?.role || 'Admin'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                                {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
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

                {/* Content */}
                <div className="p-8">
                    {/* Top title and action */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Nhân sự</h1>
                            <p className="text-gray-500 text-sm">Danh sách quản lý và nhân viên trong doanh nghiệp của bạn.</p>
                        </div>
                        {currentUser?.role === 'admin' && (
                            <button
                                onClick={() => {
                                    setErrorMsg(null);
                                    setSuccessMsg(null);
                                    setIsModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-100 cursor-pointer"
                            >
                                <UserPlus size={18} /> Thêm nhân sự mới
                            </button>
                        )}
                    </div>

                    {/* Notification messages */}
                    {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium">
                            {successMsg}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng nhân sự</p>
                                <p className="text-2xl font-extrabold text-gray-900">{users.length}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                <Shield size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Quản lý (Manager)</p>
                                <p className="text-2xl font-extrabold text-gray-900">{totalManagers}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Nhân viên (Employee)</p>
                                <p className="text-2xl font-extrabold text-gray-900">{totalEmployees}</p>
                            </div>
                        </div>
                    </div>

                    {/* Role Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { label: 'Tất cả', value: 'all' },
                            { label: 'Admin', value: 'admin' },
                            { label: 'Manager', value: 'manager' },
                            { label: 'Employee', value: 'employee' }
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setSelectedRole(tab.value)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${selectedRole === tab.value
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                                <Loader2 className="animate-spin" size={24} />
                                <span>Đang tải danh sách nhân sự...</span>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                Không tìm thấy nhân sự nào phù hợp.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                                        <th className="py-4 px-6">Nhân sự</th>
                                        <th className="py-4 px-6">Email</th>
                                        <th className="py-4 px-6">Vai trò</th>
                                        <th className="py-4 px-6">Ngày tham gia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs uppercase border border-slate-200">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-gray-900">{user.name}</span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">{user.email}</td>
                                            <td className="py-4 px-6">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${user.role === 'admin'
                                                            ? 'bg-red-50 text-red-600 border border-red-100'
                                                            : user.role === 'manager'
                                                                ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-400 text-xs">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mới tạo'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal Create User */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <UserPlus size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Thêm nhân sự mới</h3>
                                <p className="text-xs text-gray-500">Tạo tài khoản Manager hoặc Employee cho công ty.</p>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Họ và tên</label>
                                <input
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Email đăng nhập</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="email"
                                        placeholder="employee@company.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Mật khẩu khởi tạo</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Chức vụ / Vai trò</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'employee' })}
                                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${formData.role === 'employee'
                                                ? 'bg-blue-50 border-blue-600 text-blue-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        Employee (Nhân viên)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'manager' })}
                                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${formData.role === 'manager'
                                                ? 'bg-purple-50 border-purple-600 text-purple-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        Manager (Quản lý)
                                    </button>
                                </div>
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
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Tạo tài khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
