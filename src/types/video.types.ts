export type VideoStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface VideoResponse {
  id: string; // UUID as string
  prompt: string;
  durationSeconds: number;
  status: VideoStatus;
  signedUrl: string | null;
  signedUrlExpiresAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export interface VideoStatusResponse {
  status: VideoStatus;
  signedUrl: string | null;
  errorMessage: string | null;
}

export interface GenerateVideoRequest {
  prompt: string;
  durationSeconds: 4 | 6 | 8; // literal type — prevents invalid values at compile time
}

export interface VideoMetadataSuggestions {
  title: string;
  description: string;
}
