import { apiClient } from './apiClient';
import type {
  GenerateVideoRequest,
  VideoResponse,
  VideoStatusResponse,
} from '../types/video.types';
import type { PageResponse } from '../types/api.types';

// Backend wraps PageResponse in a data field: { data: PageResponse }
interface ApiResponse<T> {
  data: T;
}

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
    const { data } = await apiClient.get<ApiResponse<PageResponse<VideoResponse>>>(
      '/api/videos',
      { params: { page, size } },
    );
    // Backend wrapper: response.data contains the PageResponse with content array
    return data.data;
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
};
