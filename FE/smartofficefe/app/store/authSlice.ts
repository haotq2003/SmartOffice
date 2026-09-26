import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 1. Định nghĩa cấu trúc dữ liệu User và AuthState
export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  companyName?: string;
  tenant?: {
    _id: string;
    name: string;
    domain?: string;
    plan?: string;
    status?: string;
  };
}

export interface AuthState {
  token: string | null;
  user: UserInfo | null;
}

// 2. Hàm hỗ trợ lấy dữ liệu ban đầu từ localStorage (chỉ chạy ở phía Client)
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

const getInitialUser = (): UserInfo | null => {
  const userStr = getLocalStorageItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// 3. Trạng thái ban đầu của Auth
const initialState: AuthState = {
  token: getLocalStorageItem('token'),
  user: getInitialUser(),
};

// 4. Khởi tạo Slice quản lý Auth State
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Lưu Token và Thông tin User khi đăng nhập thành công
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: UserInfo }>
    ) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      
      // Lưu lại vào localStorage để duy trì trạng thái đăng nhập
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    // Xóa Token và User khi đăng xuất
    logout: (state) => {
      state.token = null;
      state.user = null;
      
      // Xóa thông tin đã lưu trong localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
