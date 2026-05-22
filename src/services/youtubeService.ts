import { apiClient } from './apiClient';
import type {
  OAuthInitResponse,
  YouTubeConnectionResponse,
  YouTubeExportJobResponse,
  YouTubeExportRequest,
} from '../types/youtube.types';

/**
 * Servicio para todos los endpoints del módulo YouTube.
 * Reutiliza el mismo apiClient con interceptor JWT que el resto de la app.
 */
export const youtubeService = {
  /**
   * Verifica si el usuario tiene una conexión YouTube activa.
   * Lanza error 404 si no está conectado.
   */
  async getConnection(): Promise<YouTubeConnectionResponse> {
    const { data } = await apiClient.get<YouTubeConnectionResponse>(
      '/api/youtube/connection',
    );
    return data;
  },

  /**
   * Inicia el flujo OAuth. Devuelve la URL de Google a la que redirigir al usuario.
   */
  async initiateOAuth(): Promise<OAuthInitResponse> {
    const { data } = await apiClient.post<OAuthInitResponse>(
      '/api/youtube/oauth/connect',
    );
    return data;
  },

  /**
   * Elimina la conexión YouTube del usuario.
   */
  async deleteConnection(): Promise<void> {
    await apiClient.delete('/api/youtube/connection');
  },

  /**
   * Lanza la exportación de un video a YouTube.
   * Devuelve el job en estado PENDING con el jobId para hacer polling.
   */
  async exportVideo(
    videoId: string,
    request: YouTubeExportRequest,
  ): Promise<YouTubeExportJobResponse> {
    const { data } = await apiClient.post<YouTubeExportJobResponse>(
      `/api/videos/${videoId}/youtube/export`,
      request,
    );
    return data;
  },

  /**
   * Consulta el estado actual de un job de exportación (para polling).
   */
  async getExportJob(jobId: string): Promise<YouTubeExportJobResponse> {
    const { data } = await apiClient.get<YouTubeExportJobResponse>(
      `/api/youtube/exports/${jobId}`,
    );
    return data;
  },
};