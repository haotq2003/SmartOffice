'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import UserProfileHeader from '../../components/UserProfileHeader';
import { Search, Plus, Package, Wrench, CheckCircle2, AlertTriangle, Trash2, Edit, Loader2, X, Bell, LogOut, Building, Car, Laptop, UploadCloud, ImageIcon } from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import apiClient from '../../services/apiClient';
import { Resource, ResourceInput } from '../../types/api';
import { UserInfo } from '../../store/authSlice';
import { useRouter } from 'next/navigation';

export default function ResourceManagementPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState<string>('all');
    
    // Modal state for create/edit resource
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [formData, setFormData] = useState<ResourceInput>({
        name: '',
        type: 'room',
        capacity: 10,
        location: '',
        description: '',
        images: [],
        isAutoApprove: false,
    });

    const handleUploadImage = async (file: File) => {
        setIsUploadingImage(true);
        setErrorMsg(null);
        try {
            const body = new FormData();
            body.append('file', file);

            const res = await apiClient.post('/upload', body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data && res.data.success && res.data.data.url) {
                const uploadedUrl = res.data.data.url;
                setFormData((prev) => ({
                    ...prev,
                    images: [...(prev.images || []), uploadedUrl],
                }));
                setStatusMsg('Tải ảnh lên Cloudinary thành công!');
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setErrorMsg(err.response?.data?.message || 'Tải ảnh thất bại.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
        fetchResources();
    }, []);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const res = await resourceService.getAllResources();
            if (res.success && Array.isArray(res.data)) {
                setResources(res.data);
            }
        } catch (err) {
            console.error('Error fetching resources:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingResource(null);
        setFormData({
            name: '',
            type: 'room',
            capacity: 10,
            quantity: 1,
            location: '',
            description: '',
            images: [],
            isAutoApprove: false,
        });
        setErrorMsg(null);
        setStatusMsg(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (res: Resource) => {
        setEditingResource(res);
        setFormData({
            name: res.name,
            type: res.type,
            capacity: res.capacity || 1,
            quantity: res.quantity || 1,
            location: res.location || '',
            description: res.description || '',
            images: res.images || [],
            isAutoApprove: res.isAutoApprove || false,
        });
        setErrorMsg(null);
        setStatusMsg(null);
        setIsModalOpen(true);
    };

    const handleSaveResource = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setStatusMsg(null);

        if (!formData.name) {
            setErrorMsg('Vui lòng nhập tên tài nguyên.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingResource) {
                const res = await resourceService.updateResource(editingResource._id, formData);
                if (res.success) {
                    setStatusMsg('Cập nhật tài nguyên thành công!');
                    setIsModalOpen(false);
                    fetchResources();
                }
            } else {
                const res = await resourceService.createResource(formData);
                if (res.success) {
                    setStatusMsg('Tạo tài nguyên mới thành công!');
                    setIsModalOpen(false);
                    fetchResources();
                }
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || 'Lỗi xử lý tài nguyên. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };



    const handleDeleteResource = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa tài nguyên "${name}" không?`)) return;

        try {
            const res = await resourceService.deleteResource(id);
            if (res.success) {
                setStatusMsg(`Đã xóa tài nguyên ${name} thành công.`);
                fetchResources();
            }
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.response?.data?.message || `Không thể xóa tài nguyên ${name}.`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const filteredResources = resources.filter((r) => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.location && r.location.toLowerCase().includes(searchQuery.toLowerCase()));
        if (selectedTab === 'all') return matchesSearch;
        return matchesSearch && r.type === selectedTab;
    });

    const roomCount = resources.filter(r => r.type === 'room').length;
    const vehicleCount = resources.filter(r => r.type === 'vehicle').length;
    const equipmentCount = resources.filter(r => r.type === 'equipment').length;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar activeTab="resources" />

            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm tài nguyên theo tên hoặc vị trí..."
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
                        <UserProfileHeader user={user} defaultRole="Manager" />
                    </div>
                </header>

                {/* Content */}
                <div className="p-8">
                    

                    {statusMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium flex justify-between items-center">
                            <span>{statusMsg}</span>
                            <button onClick={() => setStatusMsg(null)} className="text-xs font-bold opacity-60 hover:opacity-100">Đóng</button>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium flex justify-between items-center">
                            <span>{errorMsg}</span>
                            <button onClick={() => setErrorMsg(null)} className="text-xs font-bold opacity-60 hover:opacity-100">Đóng</button>
                        </div>
                    )}

                    {/* Stats overview */}
                    
                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { label: `Tất cả (${resources.length})`, value: 'all' },
                            { label: `Phòng họp (${roomCount})`, value: 'room' },
                            { label: `Xe công tác (${vehicleCount})`, value: 'vehicle' },
                            { label: `Thiết bị (${equipmentCount})`, value: 'equipment' }
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setSelectedTab(tab.value)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${selectedTab === tab.value
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                        <button
                            onClick={handleOpenCreateModal}
                            className="ml-auto flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-100 cursor-pointer"
                        >
                            <Plus size={18} /> Thêm tài nguyên mới
                        </button>
                    </div>

                    {/* Resource Grid */}
                    {loading ? (
                        <div className="p-12 flex justify-center items-center text-gray-400 gap-2">
                            <Loader2 className="animate-spin" size={24} />
                            <span>Đang tải danh mục cơ sở vật chất...</span>
                        </div>
                    ) : filteredResources.length === 0 ? (
                        <div className="p-12 bg-white rounded-2xl border border-gray-100 text-center text-gray-400">
                            Chưa có tài nguyên nào thuộc danh mục này.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResources.map((res) => (
                                <div key={res._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                                    <div>
                                        {/* Resource Image Header if available */}
                                        {res.images && res.images.length > 0 ? (
                                            <div className="h-40 -mx-6 -mt-6 mb-4 overflow-hidden relative bg-gray-100">
                                                <img src={res.images[0]} alt={res.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${res.type === 'room' ? 'bg-blue-50 text-blue-600' : res.type === 'vehicle' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {res.type}
                                                </span>
                                            </div>
                                        )}

                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{res.name}</h3>
                                        <p className="text-xs text-gray-400 mb-3">
                                            {res.location || 'Văn phòng chính'} • {res.type === 'equipment' ? `Kho: ${res.quantity || 1} cái` : `Sức chứa: ${res.capacity || 1} người`}
                                        </p>

                                        {res.isAutoApprove && (
                                            <span className="inline-block mb-3 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold">
                                                ⚡ Tự động duyệt đơn
                                            </span>
                                        )}

                                        {res.description && (
                                            <p className="text-xs text-gray-500 mb-4 line-clamp-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                                {res.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleOpenEditModal(res)}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Edit size={14} /> Chỉnh sửa
                                        </button>

                                        <button
                                            onClick={() => handleDeleteResource(res._id, res.name)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                            title="Xóa tài nguyên"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Create / Edit Resource */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <Package size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{editingResource ? 'Chỉnh sửa tài nguyên' : 'Thêm tài nguyên mới'}</h3>
                                <p className="text-xs text-gray-500">Khai báo cơ sở vật chất phục vụ công ty.</p>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSaveResource} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Tên tài nguyên</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Phòng Họp VIP A (Lầu 4)"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Loại tài nguyên</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                    >
                                        <option value="room">Phòng họp</option>
                                        <option value="vehicle">Xe công tác</option>
                                        <option value="equipment">Thiết bị</option>
                                    </select>
                                </div>

                                {formData.type === 'equipment' ? (
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Số lượng kho (cái)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={formData.quantity || 1}
                                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all font-bold"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 block mb-1">Sức chứa (người)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={formData.capacity || 1}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all font-bold"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Vị trí / Địa điểm</label>
                                <input
                                    type="text"
                                    placeholder="Lầu 4, Khu A hoặc Biển số xe EX-5542"
                                    value={formData.location || ''}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                />
                            </div>

                            {/* Cloudinary Image Upload Section */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Hình ảnh tài nguyên (Cloudinary)</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer">
                                        <UploadCloud size={16} />
                                        {isUploadingImage ? 'Đang tải lên Cloudinary...' : 'Tải ảnh từ máy tính'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={isUploadingImage}
                                            onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {formData.images && formData.images.length > 0 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto py-1">
                                        {formData.images.map((url, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                                                <img src={url} alt="Resource" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, images: formData.images?.filter((_, i) => i !== idx) })}
                                                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isAutoApprove"
                                    checked={formData.isAutoApprove || false}
                                    onChange={(e) => setFormData({ ...formData, isAutoApprove: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                />
                                <label htmlFor="isAutoApprove" className="text-xs font-semibold text-gray-700 cursor-pointer">
                                    ⚡ Tự động phê duyệt đơn khi nhân viên đặt tài nguyên này
                                </label>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả thiết bị / ghi chú</label>
                                <textarea
                                    rows={3}
                                    placeholder="Trang bị màn hình 4K, bảng trắng, máy chiếu hắt..."
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 focus:bg-white focus:border-blue-600 outline-none transition-all"
                                />
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
                                    disabled={isSubmitting || isUploadingImage}
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Lưu tài nguyên'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
