// ============================================================
// Tipos del módulo YouTube
// Espejo de los DTOs del backend (com.socialvideo.youtube.dto)
// ============================================================

/** Estado del job de exportación a YouTube */
export type YouTubeExportStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

/** Privacidad del video en YouTube */
export type YouTubePrivacyStatus = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';

/** Estado de sincronización del video publicado contra YouTube Data API */
export type YouTubeSyncStatus = 'UNKNOWN' | 'ACTIVE' | 'DELETED' | 'UNAVAILABLE';

/** Respuesta de GET /api/youtube/connection */
export interface YouTubeConnectionResponse {
  connected: boolean;
  channelId: string | null;
  channelName: string | null;
  connectedAt: string | null;
}

/** Respuesta de POST /api/youtube/oauth/connect */
export interface OAuthInitResponse {
  authorizationUrl: string;
  state: string;
}

/** Body de POST /api/videos/{videoId}/youtube/export */
export interface YouTubeExportRequest {
  title: string;
  description: string | null;
  tags: string | null;
  privacyStatus: YouTubePrivacyStatus;
}

/** Respuesta de GET /api/videos/{videoId}/youtube/status */
export interface YouTubeVideoStatusResponse {
  published: boolean;
  youtubeVideoId: string | null;
  youtubeVideoUrl: string | null;
  publishedAt: string | null;
  privacy: YouTubePrivacyStatus | null;
  syncStatus: YouTubeSyncStatus;
}

/** Respuesta de POST /api/videos/{videoId}/youtube/export y GET /api/youtube/exports/{jobId} */
export interface YouTubeExportJobResponse {
  jobId: string;
  videoId: string;
  status: YouTubeExportStatus;
  bytesUploaded: number;
  bytesTotal: number | null;
  progressPercent: number | null;
  youtubeVideoId: string | null;
  youtubeVideoUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}