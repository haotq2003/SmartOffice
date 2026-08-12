import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// Cấu hình Redux Store tập trung cho toàn bộ ứng dụng SmartOffice
export const store = configureStore({
  reducer: {
    // Slice quản lý trạng thái xác thực người dùng (token, user profile)
    auth: authReducer,
  },
  // Bật/tắt Redux DevTools (chỉ dùng trong môi trường phát triển)
  devTools: process.env.NODE_ENV !== 'production',
});

// Xuất các kiểu dữ liệu (Types) hữu ích cho TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
