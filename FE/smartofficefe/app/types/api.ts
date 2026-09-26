// General API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// User & Tenant Interfaces
export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'employee';
  tenantId: string;
  companyName?: string;
  tenant?: TenantInfo;
}

export interface TenantInfo {
  _id: string;
  name: string;
  domain: string;
  plan?: string;
  status?: string;
}

// Auth DTOs
export interface LoginPayload {
  email: string;
  password?: string;
}

export interface LoginData {
  token: string;
  user: UserInfo;
}

export type LoginResponse = ApiResponse<LoginData>;

export interface RegisterTenantPayload {
  tenantName: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
}

export interface RegisterTenantData {
  token?: string;
  tenant: TenantInfo;
  user: UserInfo;
}

export type RegisterTenantResponse = ApiResponse<RegisterTenantData>;

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  role: 'manager' | 'employee';
}

// Resource DTOs
export interface ResourceInput {
  name: string;
  type: 'room' | 'vehicle' | 'equipment';
  capacity?: number;
  quantity?: number;
  location?: string;
  description?: string;
  images?: string[];
  isAutoApprove?: boolean;
  status?: 'available' | 'maintenance';
}

export interface Resource {
  _id: string;
  tenantId: string;
  name: string;
  type: 'room' | 'vehicle' | 'equipment';
  capacity?: number;
  quantity?: number;
  location?: string;
  description?: string;
  images?: string[];
  isAutoApprove?: boolean;
  status: 'available' | 'maintenance';
  createdAt?: string;
  updatedAt?: string;
}

// Booking DTOs
export interface BookingInput {
  resourceId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  notes?: string;
  attendees?: string[];
  quantity?: number;
}

export interface Booking {
  _id: string;
  tenantId: string;
  userId: UserInfo | string;
  resourceId: Resource | string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'confirmed' | 'checked_in' | 'returned' | 'overdue' | 'cancelled' | 'no_show';
  quantity?: number;
  notes?: string;
  attendees?: string[];
  createdAt?: string;
}

export interface AvailabilitySlot {
  bookingId?: string;
  startTime: string;
  endTime: string;
  status: string;
  user?: { name: string; email: string } | null;
}

// Notification Interface
export interface NotificationItem {
  _id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking_created' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationResponseData {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface Plan {
  _id: string;
  name: string;
  code: string;
  price: number;
  maxUsers: number;
  maxResources: number;
  features: string[];
  description?: string;
}
