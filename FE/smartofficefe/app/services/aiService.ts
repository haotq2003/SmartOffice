import apiClient from './apiClient';

export interface RecommendedRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  location?: string;
  description?: string;
  isAutoApprove?: boolean;
}

export interface SmartBookingResponse {
  success: boolean;
  data: {
    message: string;
    searchParams?: {
      date: string;
      startTime: string;
      endTime: string;
    };
    recommendedRooms: RecommendedRoom[];
  };
}

export const aiService = {
  sendSmartBookingPrompt: async (prompt: string): Promise<SmartBookingResponse> => {
    const response = await apiClient.post<SmartBookingResponse>('/ai/smart-booking', { prompt });
    return response.data;
  }
};
