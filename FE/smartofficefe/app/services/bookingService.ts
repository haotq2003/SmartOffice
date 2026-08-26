import apiClient from './apiClient';
import { ApiResponse, Booking, BookingInput, AvailabilitySlot } from '../types/api';

export const bookingService = {
  /**
   * Gửi yêu cầu đặt lịch tài nguyên mới
   */
  async createBooking(payload: BookingInput): Promise<ApiResponse<Booking>> {
    const response = await apiClient.post<ApiResponse<Booking>>('/bookings', payload);
    return response.data;
  },

  /**
   * Lấy lịch sử đặt lịch của người dùng đang đăng nhập
   */
  async getMyBookings(): Promise<ApiResponse<Booking[]>> {
    const response = await apiClient.get<ApiResponse<Booking[]>>('/bookings/my-bookings');
    return response.data;
  },

  /**
   * Lấy tất cả yêu cầu đặt lịch trong công ty (Dành cho Admin / Manager)
   */
  async getAllBookings(): Promise<ApiResponse<Booking[]>> {
    const response = await apiClient.get<ApiResponse<Booking[]>>('/bookings/all');
    return response.data;
  },

  /**
   * Phê duyệt hoặc Từ chối đơn đặt lịch (Dành cho Admin / Manager)
   */
  async updateBookingStatus(id: string, status: 'approved' | 'rejected' | 'pending' | 'checked_in' | 'returned' | 'cancelled' | 'no_show'): Promise<ApiResponse<Booking>> {
    const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status });
    return response.data;
  },

  /**
   * Kiểm tra khung giờ bận/trống của 1 tài nguyên theo ngày (YYYY-MM-DD)
   */
  async getAvailability(resourceId: string, date: string): Promise<ApiResponse<AvailabilitySlot[]>> {
    const response = await apiClient.get<ApiResponse<AvailabilitySlot[]>>('/availability', {
      params: { resourceId, date },
    });
    return response.data;
  },
};
