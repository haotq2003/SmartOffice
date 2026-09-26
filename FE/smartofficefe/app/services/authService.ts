import apiClient from './apiClient';
import {
  LoginPayload,
  LoginResponse,
  RegisterTenantPayload,
  RegisterTenantResponse,
  CreateUserPayload,
  ApiResponse,
} from '../types/api';

export const authService = {
  /**
   * Đăng nhập hệ thống
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },

  /**
   * Đăng ký gói doanh nghiệp mới (Multi-tenant)
   */
  async registerTenant(payload: RegisterTenantPayload): Promise<RegisterTenantResponse> {
    const response = await apiClient.post<RegisterTenantResponse>('/auth/register-tenant', payload);
    return response.data;
  },

  /**
   * Tạo tài khoản nhân viên / quản lý (Dành cho Admin)
   */
  async createUser(payload: CreateUserPayload): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/auth/create-user', payload);
    return response.data;
  },

  /**
   * Lấy danh sách nhân sự trong công ty (Dành cho Admin / Manager)
   */
  async getUsers(): Promise<ApiResponse> {
    const response = await apiClient.get<ApiResponse>('/auth/users');
    return response.data;
  },

  /**
   * Lấy thông tin user hiện tại kèm thông tin tenant/công ty
   */
  async getMe(): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>('/auth/me');
    return response.data;
  },
};
