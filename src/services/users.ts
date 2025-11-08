import axios from 'axios';
import type { User, ApiResponse, CreateUserRequest, UpdateUserRequest, SetPasswordRequest } from '../types/user';
import { clearAuthSession, getStoredToken } from '../utils/authToken';

// Use relative path to go through Vite proxy (configured in vite.config.ts)
const API_BASE_URL = '/api/users';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header for protected endpoints
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    (config.headers = config.headers || {}).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Basic 401 handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn('Unauthorized (401) when calling users API. Clearing session.');
      clearAuthSession();
    }
    return Promise.reject(error);
  },
);

export const usersApi = {
  // Get all users
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get<ApiResponse<User[]>>('');
    // The axios response.data is already the ApiResponse object
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: number): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>(`/${id}`);
    return response.data;
  },

  // Create user (ADMIN only)
  createUser: async (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('', userData);
    return response.data;
  },

  // Update user (ADMIN only)
  updateUser: async (id: number, userData: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`/${id}`, userData);
    return response.data;
  },

  // Delete user (ADMIN only)
  deleteUser: async (id: number, reassignManagerId?: number): Promise<ApiResponse<void>> => {
    const params = reassignManagerId ? { reassignManagerId: reassignManagerId.toString() } : {};
    const response = await api.delete<ApiResponse<void>>(`/${id}`, { params });
    return response.data;
  },

  // Set password (no auth required)
  setPassword: async (passwordData: SetPasswordRequest): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/set-password', passwordData);
    return response.data;
  },

  // Verify invitation token (no auth required)
  verifyInvitationToken: async (token: string): Promise<ApiResponse<string>> => {
    const response = await api.get<ApiResponse<string>>('/accept-invitation', {
      params: { token },
    });
    return response.data;
  },
};

