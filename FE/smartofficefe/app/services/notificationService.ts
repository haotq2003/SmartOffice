import apiClient from './apiClient';
import { ApiResponse, NotificationResponseData, NotificationItem } from '../types/api';

export const notificationService = {
  // Get paginated list of notifications & unread count
  async getNotifications(page = 1, limit = 20): Promise<ApiResponse<NotificationResponseData>> {
    const response = await apiClient.get<ApiResponse<NotificationResponseData>>('/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  // Get unread notification count
  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return response.data;
  },

  // Mark single notification as read
  async markAsRead(id: string): Promise<ApiResponse<NotificationItem>> {
    const response = await apiClient.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse<null>> {
    const response = await apiClient.patch<ApiResponse<null>>('/notifications/read-all');
    return response.data;
  },
};
