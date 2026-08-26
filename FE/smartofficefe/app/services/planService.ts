import apiClient from './apiClient';
import { Plan } from '../types/api';

export const planService = {
    getAllPlans: async () => {
        const response = await apiClient.get('/plans');
        return response.data;
    },
    getPlanById: async (id: string) => {
        const response = await apiClient.get(`/plans/${id}`);
        return response.data;
    },
    createPlan: async (plan: Partial<Plan>) => {
        const response = await apiClient.post('/plans', plan);
        return response.data;
    },
    updatePlan: async (id: string, plan: Partial<Plan>) => {
        const response = await apiClient.put(`/plans/${id}`, plan);
        return response.data;
    },
    deletePlan: async (id: string) => {
        const response = await apiClient.delete(`/plans/${id}`);
        return response.data;
    },
};