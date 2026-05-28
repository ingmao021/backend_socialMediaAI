import { apiClient } from './apiClient';
import type { VideoResponse } from '../types/video.types';
import type { PageResponse } from '../types/api.types';

export const favoriteService = {
  async addFavorite(videoId: string): Promise<void> {
    await apiClient.post(`/api/videos/${videoId}/favorite`);
  },

  async removeFavorite(videoId: string): Promise<void> {
    await apiClient.delete(`/api/videos/${videoId}/favorite`);
  },

  async listFavorites(page: number = 0, size: number = 6): Promise<PageResponse<VideoResponse>> {
    const { data } = await apiClient.get<PageResponse<VideoResponse>>(
      '/api/videos/favorites',
      { params: { page, size } },
    );
    return data;
  },
};
