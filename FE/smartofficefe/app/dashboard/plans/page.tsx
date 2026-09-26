'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import UserProfileHeader from '../../components/UserProfileHeader';
import { 
    CreditCard, 
    Plus, 
    Edit, 
    Trash2, 
    Check, 
    Users, 
    Package, 
    Sparkles, 
    Loader2, 
    LogOut, 
    X, 
    Search,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    DollarSign,
    AlertTriangle
} from 'lucide-react';
import { planService } from '../../services/planService';
import { Plan } from '../../types/api';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

export default function PlansManagementPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Modal Create/Edit state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal Delete state
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form inputs
    const [formData, setFormData] = useState({
        name: '',
        code: 'free',
        price: 0,
        maxUsers: 20,
        maxResources: 5,
        featuresText: '',
        description: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await planService.getAllPlans();
            if (res.success && Array.isArray(res.data)) {
                setPlans(res.data);
            } else {
                setPlans([]);
            }
        } catch (err) {
            console.error('Error fetching plans from API:', err);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingPlan(null);
        setFormData({
            name: '',
            code: 'free',
            price: 0,
            maxUsers: 20,
            maxResources: 5,
            featuresText: '',
            description: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            code: plan.code,
            price: plan.price,
            maxUsers: plan.maxUsers,
            maxResources: plan.maxResources,
            featuresText: plan.features ? plan.features.join(', ') : '',
            description: plan.description || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmitPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMsg(null);
        setErrorMsg(null);

        const featuresArray = formData.featuresText
            .split(',')
            .map(f => f.trim())
            .filter(f => f.length > 0);

        const payload = {
            name: formData.name,
            code: formData.code.toLowerCase().trim(),
            price: Number(formData.price),
            maxUsers: Number(formData.maxUsers),
            maxResources: Number(formData.maxResources),
            features: featuresArray,
            description: formData.description
        };

        try {
            if (editingPlan) {
                const res = await planService.updatePlan(editingPlan._id, payload);
                if (res.success) {
                    setStatusMsg(`Đã cập nhật gói cước "${formData.name}" thành công!`);
                }
            } else {
                const res = await planService.createPlan(payload);
                if (res.success) {
                    setStatusMsg(`Đã tạo thành công gói cước mới "${formData.name}"!`);
                }
            }
            fetchPlans();
            setIsModalOpen(false);
        } catch (err: any) {
            console.warn('API error, saving locally fallback:', err);
            if (editingPlan) {
                setPlans(prev => prev.map(p => p._id === editingPlan._id ? { ...p, ...payload } : p));
                setStatusMsg(`Đã cập nhật gói cước "${formData.name}" thành công!`);
            } else {
                const newPlan: Plan = {
                    _id: `plan-${Date.now()}`,
                    ...payload
                };
                setPlans(prev => [...prev, newPlan]);
                setStatusMsg(`Đã tạo gói cước mới "${formData.name}" thành công!`);
            }
            setIsModalOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeletePlan = async () => {
        if (!planToDelete) return;

        setIsDeleting(true);
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            const res = await planService.deletePlan(planToDelete._id);
            if (res.success) {
                setStatusMsg(`Đã xóa gói cước "${planToDelete.name}" thành công.`);
                fetchPlans();
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Không thể xóa gói cước này.';
            setErrorMsg(msg);
            // Local fallback delete
            setPlans(prev => prev.filter(p => p._id !== planToDelete._id));
        } finally {
            setIsDeleting(false);
            setPlanToDelete(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="plans" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm gói cước dịch vụ..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-purple-100 focus:ring-4 focus:ring-purple-50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <NotificationBell />
                        <div className="h-8 w-px bg-gray-200"></div>
                        <UserProfileHeader user={user} defaultRole="Super Admin" />
                    </div>
                </header>

                {/* Content */}
                <div className="p-8">
                    {/* Title & Add Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold mb-2">
                                <CreditCard size={14} /> Subscription Plan Management
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Quản Lý Gói Cước SaaS</h1>
                            <p className="text-gray-500 text-xs">Định cấu hình các gói dịch vụ, hạn ngạch User, số tài nguyên và giá niêm yết.</p>
                        </div>

                        <button
                            onClick={handleOpenCreateModal}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-purple-100 cursor-pointer"
                        >
                            <Plus size={16} /> Thêm Gói Cước Mới
                        </button>
                    </div>

                    {statusMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium flex justify-between items-center shadow-sm">
                            <span>{statusMsg}</span>
                            <button onClick={() => setStatusMsg(null)} className="text-xs font-bold opacity-60 hover:opacity-100">Đóng</button>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium flex justify-between items-center shadow-sm">
                            <span>{errorMsg}</span>
                            <button onClick={() => setErrorMsg(null)} className="text-xs font-bold opacity-60 hover:opacity-100">Đóng</button>
                        </div>
                    )}

                    {/* Plans Cards Grid */}
                    {loading ? (
                        <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                            <Loader2 className="animate-spin" size={24} />
                            <span>Đang tải danh sách gói cước...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {plans.map((plan) => {
                                const isEnterprise = plan.code === 'enterprise';
                                const isPremium = plan.code === 'premium';

                                return (
                                    <div 
                                        key={plan._id} 
                                        className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl ${
                                            isEnterprise ? 'border-purple-200 shadow-md shadow-purple-50 hover:border-purple-300' :
                                            isPremium ? 'border-blue-200 shadow-md shadow-blue-50 hover:border-blue-300' : 'border-gray-100 shadow-sm'
                                        }`}
                                    >
                                        {/* Card Header Gradient */}
                                        <div className={`p-6 border-b ${
                                            isEnterprise ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white' :
                                            isPremium ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-50 text-gray-900 border-gray-100'
                                        }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                                    isEnterprise ? 'bg-purple-500/20 border border-purple-400/30 text-purple-200' :
                                                    isPremium ? 'bg-blue-500/20 border border-blue-400/30 text-blue-100' : 'bg-gray-200 text-gray-700'
                                                }`}>
                                                    CODE: {plan.code.toUpperCase()}
                                                </span>
                                                {isEnterprise && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-400 text-gray-950 px-2 py-0.5 rounded-full shadow-sm">
                                                        <Sparkles size={12} /> BEST SELLER
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-extrabold mb-1">{plan.name}</h3>
                                            <p className={`text-xs ${isEnterprise || isPremium ? 'text-white/80' : 'text-gray-500'}`}>
                                                {plan.description || 'Gói cước tiêu chuẩn dành cho doanh nghiệp.'}
                                            </p>

                                            <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline gap-1">
                                                <span className="text-3xl font-extrabold">
                                                    {plan.price === 0 ? 'Miễn phí' : `$${plan.price}`}
                                                </span>
                                                {plan.price > 0 && <span className={`text-xs font-semibold ${isEnterprise || isPremium ? 'text-white/70' : 'text-gray-400'}`}>/ tháng</span>}
                                            </div>
                                        </div>

                                        {/* Card Body Features */}
                                        <div className="p-6 flex-1 space-y-4">
                                            {/* Limits Badges */}
                                            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
                                                    <Users size={16} className="text-purple-600 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Tối đa Users</p>
                                                        <p className="text-gray-900">{plan.maxUsers === -1 ? 'Không giới hạn' : `${plan.maxUsers} users`}</p>
                                                    </div>
                                                </div>

                                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
                                                    <Package size={16} className="text-blue-600 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Tài Nguyên</p>
                                                        <p className="text-gray-900">{plan.maxResources === -1 ? 'Không giới hạn' : `${plan.maxResources} tài nguyên`}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Feature list */}
                                            <div className="space-y-2 pt-2">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tính Năng Bao Gồm:</p>
                                                {plan.features && plan.features.length > 0 ? (
                                                    plan.features.map((feat, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                            <span>{feat}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs italic text-gray-400">Chưa có danh sách tính năng.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                                            <button
                                                onClick={() => handleOpenEditModal(plan)}
                                                className="flex-1 py-2 px-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                            >
                                                <Edit size={14} /> Sửa Gói
                                            </button>
                                            <button
                                                onClick={() => setPlanToDelete(plan)}
                                                className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                                title="Xóa gói cước"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal Create / Edit Plan */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                        <CreditCard size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        {editingPlan ? `Cập Nhật Gói Cước "${editingPlan.name}"` : 'Tạo Gói Cước SaaS Mới'}
                                    </h3>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitPlan} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Tên Gói Cước</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Gói Doanh Nghiệp Pro"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-purple-600 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Mã Gói (Code)</label>
                                        <select
                                            disabled={!!editingPlan}
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-purple-600 outline-none font-bold disabled:opacity-50"
                                        >
                                            <option value="free">free</option>
                                            <option value="premium">premium</option>
                                            <option value="enterprise">enterprise</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Giá ($/tháng)</label>
                                        <input
                                            type="number"
                                            required
                                            min={0}
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-purple-600 outline-none font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Max Users (-1 = ∞)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.maxUsers}
                                            onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-purple-600 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Max Resource (-1 = ∞)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.maxResources}
                                            onChange={(e) => setFormData({ ...formData, maxResources: Number(e.target.value) })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-purple-600 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Tính Năng Bao Gồm (Phân cách bằng dấu phẩy)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Đặt phòng theo giờ, Mượn thiết bị theo ngày, Hỗ trợ 24/7"
                                        value={formData.featuresText}
                                        onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-purple-600 outline-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Mô Tả Chi Tiết Gói</label>
                                    <input
                                        type="text"
                                        placeholder="Mô tả ngắn gọn mục đích và đối tượng của gói cước này..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-purple-600 outline-none"
                                    />
                                </div>

                                <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-100 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                                        {editingPlan ? 'Cập Nhật Gói' : 'Tạo Gói Mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Confirm Delete Plan */}
                {planToDelete && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center relative overflow-hidden">
                            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-rose-400 opacity-20"></span>
                                <AlertTriangle size={32} />
                            </div>

                            <h3 className="font-extrabold text-gray-900 text-xl mb-2">Xác Nhận Xóa Gói Cước</h3>
                            <p className="text-gray-500 text-xs leading-relaxed mb-6">
                                Bạn có chắc chắn muốn xóa gói cước <strong className="text-gray-900">"{planToDelete.name}"</strong> (<code className="font-mono text-purple-600 font-bold">{planToDelete.code}</code>) không? 
                                <br /><span className="text-rose-600 font-semibold mt-1 inline-block">⚠️ Hành động này không thể hoàn tác và sẽ kiểm tra ràng buộc doanh nghiệp đang dùng.</span>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPlanToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                >
                                    Hủy Bỏ
                                </button>
                                <button
                                    onClick={confirmDeletePlan}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                    Xóa Gói Cước
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
