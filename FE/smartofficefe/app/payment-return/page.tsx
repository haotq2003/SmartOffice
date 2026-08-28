'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ShieldCheck, Building } from 'lucide-react';
import { paymentService } from '../services/paymentService';

function PaymentReturnContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'success' | 'failed' | 'error'>('failed');
    const [resultData, setResultData] = useState<any>(null);
    const [gatewayName, setGatewayName] = useState<string>('VNPay / MoMo');

    useEffect(() => {
        const queryString = searchParams.toString();
        if (queryString) {
            verifyPayment(queryString);
        } else {
            setLoading(false);
            setStatus('failed');
        }
    }, [searchParams]);

    const verifyPayment = async (qs: string) => {
        setLoading(true);
        try {
            // Check if return query is from MoMo or VNPay
            const isMomo = searchParams.has('resultCode') || searchParams.has('partnerCode');
            setGatewayName(isMomo ? 'Ví MoMo Sandbox' : 'VNPay Sandbox');

            const res = isMomo
                ? await paymentService.verifyMomoReturn(qs)
                : await paymentService.verifyVnPayReturn(qs);

            if (res.success) {
                setStatus('success');
                setResultData(res.data);
            } else {
                setStatus('failed');
                setResultData(res.data);
            }
        } catch (err) {
            console.error('Error verifying payment return:', err);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const rawAmount = resultData?.vnp_Amount || resultData?.amount;
    const amountVND = rawAmount 
        ? (parseInt(rawAmount) > 10000000 ? parseInt(rawAmount) / 100 : parseInt(rawAmount)).toLocaleString('vi-VN') 
        : '0';

    const txnRef = resultData?.vnp_TxnRef || resultData?.orderId || resultData?.transId || 'N/A';
    const orderInfo = resultData?.vnp_OrderInfo || resultData?.orderInfo || 'Gia hạn gói cước SmartOffice';

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-md w-full p-8 text-center space-y-6">
                {loading ? (
                    <div className="py-12 space-y-4">
                        <Loader2 size={48} className="animate-spin text-pink-600 mx-auto" />
                        <h2 className="text-lg font-bold text-gray-900">Đang xác thực giao dịch...</h2>
                        <p className="text-xs text-gray-500">Vui lòng chờ trong giây lát</p>
                    </div>
                ) : status === 'success' ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-md">
                            <CheckCircle2 size={36} />
                        </div>

                        <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Giao dịch thành công ({gatewayName})
                            </span>
                            <h1 className="text-2xl font-black text-gray-900 pt-2">Thanh Toán Thành Công!</h1>
                            <p className="text-xs text-gray-500">Gói cước doanh nghiệp của bạn đã được gia hạn tự động.</p>
                        </div>

                        {/* Transaction Detail Card */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left text-xs space-y-2">
                            <div className="flex justify-between border-b border-gray-200/60 pb-2">
                                <span className="text-gray-500">Cổng thanh toán:</span>
                                <span className="font-bold text-pink-600">{gatewayName}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200/60 pb-2">
                                <span className="text-gray-500">Số tiền:</span>
                                <span className="font-bold text-blue-600">{amountVND} VNĐ</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200/60 pb-2">
                                <span className="text-gray-500">Mã giao dịch:</span>
                                <span className="font-mono text-gray-800">{txnRef}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Nội dung:</span>
                                <span className="font-semibold text-gray-800 text-right max-w-[200px] truncate">{orderInfo}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/dashboard/admin')}
                            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <ArrowLeft size={16} /> Quay lại Bảng Điều Khiển Admin
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-md">
                            <XCircle size={36} />
                        </div>

                        <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                                Giao dịch không thành công
                            </span>
                            <h1 className="text-2xl font-black text-gray-900 pt-2">Thanh Toán Bị Hủy Hoặc Lỗi</h1>
                            <p className="text-xs text-gray-500">Giao dịch qua cổng {gatewayName} không thể hoàn tất.</p>
                        </div>

                        <button
                            onClick={() => router.push('/dashboard/admin')}
                            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <ArrowLeft size={16} /> Quay lại Bảng Điều Khiển Admin
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function PaymentReturnPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Loader2 size={40} className="animate-spin text-pink-600" />
            </div>
        }>
            <PaymentReturnContent />
        </Suspense>
    );
}
