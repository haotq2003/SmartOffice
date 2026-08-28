import apiClient from './apiClient';

export const paymentService = {
    createVnPayUrl: async (data: { planCode: string; priceUSD: number; months: number; tenantId?: string }) => {
        const response = await apiClient.post('/payment/create-vnpay-url', data);
        return response.data;
    },
    verifyVnPayReturn: async (queryString: string) => {
        const response = await apiClient.get(`/payment/vnpay-return?${queryString}`);
        return response.data;
    },
    createMomoUrl: async (data: { planCode: string; priceUSD: number; months: number; tenantId?: string; requestType?: string }) => {
        const response = await apiClient.post('/payment/create-momo-url', data);
        return response.data;
    },
    verifyMomoReturn: async (queryString: string) => {
        const response = await apiClient.get(`/payment/momo-return?${queryString}`);
        return response.data;
    }
};
