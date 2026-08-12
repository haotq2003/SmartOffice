import apiClient from './apiClient';
import { ApiResponse, Resource, ResourceInput } from '../types/api';

export const resourceService = {
  /**
   * Lấy danh sách toàn bộ tài nguyên của Tenant
   */
  async getAllResources(): Promise<ApiResponse<Resource[]>> {
    const response = await apiClient.get<ApiResponse<Resource[]>>('/resources');
    return response.data;
  },

  /**
   * Lấy chi tiết 1 tài nguyên theo ID
   */
  async getResourceById(id: string): Promise<ApiResponse<Resource>> {
    const response = await apiClient.get<ApiResponse<Resource>>(`/resources/${id}`);
    return response.data;
  },

  /**
   * Tạo mới một tài nguyên (Phòng họp, xe công tác, thiết bị)
   */
  async createResource(payload: ResourceInput): Promise<ApiResponse<Resource>> {
    const response = await apiClient.post<ApiResponse<Resource>>('/resources', payload);
    return response.data;
  },

  /**
   * Cập nhật thông tin tài nguyên
   */
  async updateResource(id: string, payload: Partial<ResourceInput>): Promise<ApiResponse<Resource>> {
    const response = await apiClient.put<ApiResponse<Resource>>(`/resources/${id}`, payload);
    return response.data;
  },

  /**
   * Xóa một tài nguyên khỏi hệ thống
   */
  async deleteResource(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/resources/${id}`);
    return response.data;
  },
};
