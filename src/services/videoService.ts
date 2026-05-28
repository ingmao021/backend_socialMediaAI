import { apiClient } from './apiClient';
import type {
  GenerateVideoRequest,
  VideoMetadataSuggestions,
  VideoResponse,
  VideoStatusResponse,
} from '../types/video.types';
import type { PageResponse } from '../types/api.types';

export const videoService = {
  async generateVideo(
    request: GenerateVideoRequest,
  ): Promise<VideoResponse> {
    const { data } = await apiClient.post<VideoResponse>(
      '/api/videos/generate',
      request,
    );
    return data;
  },

  async getVideoStatus(videoId: string): Promise<VideoStatusResponse> {
    const { data } = await apiClient.get<VideoStatusResponse>(
      `/api/videos/${videoId}/status`,
    );
    return data;
  },

  async listVideos(
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<VideoResponse>> {
    const { data } = await apiClient.get<PageResponse<VideoResponse>>(
      '/api/videos',
      { params: { page, size } },
    );
    return data;
  },

  async getVideo(videoId: string): Promise<VideoResponse> {
    const { data } = await apiClient.get<VideoResponse>(
      `/api/videos/${videoId}`,
    );
    return data;
  },

  async deleteVideo(videoId: string): Promise<void> {
    await apiClient.delete(`/api/videos/${videoId}`);
  },

  async getMetadataSuggestions(videoId: string): Promise<VideoMetadataSuggestions> {
    const { data } = await apiClient.get<VideoMetadataSuggestions>(
      `/api/videos/${videoId}/metadata-suggestions`,
    );
    return data;
  },
};
