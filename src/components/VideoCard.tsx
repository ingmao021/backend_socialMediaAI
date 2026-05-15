import { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { videoService } from '../services/videoService';
import { useVideoPolling } from '../hooks/useVideoPolling';
import type { VideoResponse } from '../types/video.types';

interface VideoCardProps {
  video: VideoResponse;
  onDelete: (videoId: string) => void;
  onVideoCompleted?: (videoId: string) => void;
}

const STATUS_CONFIG = {
  PROCESSING: { label: 'Procesando', className: 'status-processing' },
  COMPLETED: { label: 'Completado', className: 'status-completed' },
  FAILED: { label: 'Error', className: 'status-failed' },
} as const;

const isSignedUrlExpired = (expiresAt: string | null | undefined): boolean => {
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt);
  const margin = 60 * 60 * 1000; // 1 hora de margen
  return Date.now() > expiry.getTime() - margin;
};

export function VideoCard({ video, onDelete, onVideoCompleted }: VideoCardProps) {
  const [currentVideo, setCurrentVideo] = useState<VideoResponse>(video);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentVideo(video);
  }, [video]);

  useVideoPolling({
    videoId: currentVideo.status === 'PROCESSING' ? currentVideo.id : null,
    onComplete: (signedUrl) => {
      setCurrentVideo((prev) => ({
        ...prev,
        status: 'COMPLETED',
        signedUrl,
      }));
      // Notificar al padre para que refresque la lista de videos
      onVideoCompleted?.(currentVideo.id);
    },
    onFailed: (errorMessage) => {
      setCurrentVideo((prev) => ({
        ...prev,
        status: 'FAILED',
        errorMessage,
      }));
    },
  });

  useEffect(() => {
    const checkAndRefreshUrl = async () => {
      if (currentVideo.status === 'COMPLETED' && isSignedUrlExpired(currentVideo.signedUrlExpiresAt)) {
        try {
          const updatedVideo = await videoService.getVideo(currentVideo.id);
          setCurrentVideo(updatedVideo);
        } catch (err) {
          console.error('Error refreshing video URL', err);
        }
      }
    };
    checkAndRefreshUrl();
  }, [currentVideo.status, currentVideo.signedUrlExpiresAt, currentVideo.id]);

  const forceRefreshUrl = async () => {
    if (currentVideo.status === 'COMPLETED') {
      try {
        const updatedVideo = await videoService.getVideo(currentVideo.id);
        setCurrentVideo(updatedVideo);
      } catch (err) {
        console.error('Error forcing video URL refresh', err);
      }
    }
  };

  const statusCfg = STATUS_CONFIG[currentVideo.status];

  return (
    <div className="video-card glass-card">
      <div className="video-card-preview">
        {currentVideo.status === 'COMPLETED' && currentVideo.signedUrl ? (
          <VideoPlayer src={currentVideo.signedUrl} onNetworkError={forceRefreshUrl} />
        ) : currentVideo.status === 'PROCESSING' ? (
          <div className="video-card-processing">
            <div className="spinner" />
            <span>Generando video…</span>
          </div>
        ) : currentVideo.status === 'FAILED' ? (
          <div className="video-card-error">
            <span>⚠️ {currentVideo.errorMessage || 'Error en la generación'}</span>
          </div>
        ) : (
          // Caso cuando está COMPLETED pero sin signedUrl (debería ser muy raro due to backend)
          <div className="video-card-error">
            <span>⚠️ URL del video no disponible</span>
          </div>
        )}
      </div>

      <div className="video-card-content">
        <div className={`status-badge ${statusCfg.className}`}>
          <span className="status-dot" />
          {statusCfg.label}
        </div>
        <p className="video-card-prompt" title={currentVideo.prompt}>
          {currentVideo.prompt}
        </p>
        <div className="video-card-meta">
          <span>{currentVideo.durationSeconds}s</span>
          <span>
            {new Date(currentVideo.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="video-card-actions">
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(currentVideo.id)}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
