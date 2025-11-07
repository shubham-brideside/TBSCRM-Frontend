import axios from 'axios';
import type { ApiResponse, LoginRequest, LoginResponse } from '../types/auth';

const authClient = axios.create({
  baseURL: '/api/auth',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  login: async (payload: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await authClient.post<ApiResponse<LoginResponse>>('/login', payload);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    const response = await authClient.post<ApiResponse<void>>('/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (payload: { token: string; password: string; confirmPassword?: string }): Promise<ApiResponse<void>> => {
    const response = await authClient.post<ApiResponse<void>>('/reset-password', payload);
    return response.data;
  },
};


