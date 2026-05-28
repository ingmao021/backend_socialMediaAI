import { apiClient } from './apiClient';
import type { UserResponse, UpdateProfileRequest } from '../types/user.types';

export const userService = {
  async getMe(): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>('/api/users/me');
    return data;
  },

  async updateProfile(request: UpdateProfileRequest): Promise<UserResponse> {
    const { data } = await apiClient.put<UserResponse>(
      '/api/users/me',
      request,
    );
    return data;
  },

  async uploadAvatar(file: File): Promise<UserResponse> {
    const formData = new FormData();
    formData.append('file', file);
    // postForm (Axios 1.x) serializes FormData with correct multipart/form-data
    // boundary header, while still applying the JWT interceptor from apiClient.
    const { data } = await apiClient.postForm<UserResponse>(
      '/api/users/me/avatar',
      formData,
    );
    return data;
  },
};
