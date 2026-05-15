import { apiClient } from './apiClient';
import { saveToken, clearToken, getToken } from '../utils/tokenStorage';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
} from '../types/auth.types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/api/auth/register',
      data,
    );
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/api/auth/login',
      data,
    );
    return response.data;
  },

  async googleLogin(googleToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/google', {
      idToken: googleToken,
    });
    return response.data;
  },

  saveToken,
  clearToken,
  getToken,
};
