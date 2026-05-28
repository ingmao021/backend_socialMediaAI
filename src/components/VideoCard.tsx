import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { VideoPlayer } from './VideoPlayer';
import { videoService } from '../services/videoService';
import { favoriteService } from '../services/favoriteService';
import { youtubeService } from '../services/youtubeService';
import { YouTubeShareModal } from './YouTubeShareModal';
import { useVideoPolling } from '../hooks/useVideoPolling';
import type { VideoResponse } from '../types/video.types';
import type { YouTubePrivacyStatus } from '../types/youtube.types';

interface VideoCardProps {
  video: VideoResponse;
  onDelete: (videoId: string) => void;
  onVideoCompleted?: (videoId: string) => void;
  onFavoriteChange?: (videoId: string, isFavorite: boolean) => void;
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

// ── AÑADIDO: estados del flujo de compartir en YouTube ────────────────
type YouTubeShareState = 'idle' | 'form' | 'uploading' | 'done' | 'error';

/** Info persistente tras publicar con éxito */
interface PublishedInfo {
  url: string;
  privacy: YouTubePrivacyStatus;
}
// ─────────────────────────────────────────────────────────────────────

const PRIVACY_LABEL: Record<YouTubePrivacyStatus, string> = {
  PUBLIC: '🌐 Público',
  UNLISTED: '🔗 No listado',
  PRIVATE: '🔒 Privado',
};

export function VideoCard({ video, onDelete, onVideoCompleted, onFavoriteChange }: VideoCardProps) {
  const [currentVideo, setCurrentVideo] = useState<VideoResponse>(video);
  const [isFavorite, setIsFavorite] = useState<boolean>(video.isFavorite ?? false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  // ── AÑADIDO: estado YouTube ──────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [ytState, setYtState] = useState<YouTubeShareState>('idle');
  const [ytUrl, setYtUrl] = useState<string | null>(null);
  const [ytError, setYtError] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDesc] = useState('');
  const [shareTags, setShareTags] = useState('');
  const [sharePrivacy, setSharePrivacy] = useState<YouTubePrivacyStatus>('PRIVATE');
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  /** Persiste info del video publicado en YouTube incluso tras cerrar el modal */
  const [publishedInfo, setPublishedInfo] = useState<PublishedInfo | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentVideo(video);
  }, [video]);

  // ── AÑADIDO: limpiar polling al desmontar ────────────────────────────
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────────

  // ── AÑADIDO: recuperar info de YouTube al recargar ────────────────
  useEffect(() => {
    const stored = localStorage.getItem(`yt-published-${currentVideo.id}`);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPublishedInfo(JSON.parse(stored));
      } catch {
        localStorage.removeItem(`yt-published-${currentVideo.id}`);
      }
    }
  }, [currentVideo.id]);
  // ─────────────────────────────────────────────────────────────────

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

  // ── AÑADIDO: funciones del flujo YouTube ─────────────────────────────
  //    La lógica de integración (polling, servicios, endpoints) no se toca.
  //    Solo se añade el control del modal y el estado publishedInfo.

  const startJobPolling = (jobId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const job = await youtubeService.getExportJob(jobId);
        if (job.status === 'COMPLETED') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setYtState('done');
          setYtUrl(job.youtubeVideoUrl);
          toast.success('¡Video publicado en YouTube!');
        } else if (job.status === 'FAILED') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          const msg = job.errorMessage ?? 'Error al subir el video a YouTube';
          setYtState('error');
          setYtError(msg);
          toast.error(msg);
        }
      } catch {
        console.error('[YT poll] error transient, retrying...');
      }
    }, 2000);
  };

  const handleShareClick = async () => {
    setCheckingConnection(true);
    try {
      const connection = await youtubeService.getConnection();
      if (!connection.connected) {
        const { authorizationUrl } = await youtubeService.initiateOAuth();
        window.location.href = authorizationUrl;
        return;
      }
      setShareTitle(currentVideo.prompt.substring(0, 100));
      setShareDesc('');
      setShareTags('');
      setSharePrivacy('PRIVATE');
      setYtState('form');
      setModalOpen(true);
      setLoadingSuggestions(true);
      videoService.getMetadataSuggestions(currentVideo.id)
        .then((suggestions) => {
          setShareTitle(suggestions.title.substring(0, 100));
          setShareDesc(suggestions.description);
        })
        .catch(() => {
          toast('No se pudieron cargar sugerencias de IA. Podés editarlos manualmente.', {
            icon: 'ℹ️',
            duration: 3000,
          });
        })
        .finally(() => {
          setLoadingSuggestions(false);
        });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const code = (err.response?.data as { code?: string })?.code;
        if (code === 'YOUTUBE_NOT_CONNECTED') {
          try {
            const { authorizationUrl } = await youtubeService.initiateOAuth();
            window.location.href = authorizationUrl;
          } catch {
            toast.error('No se pudo iniciar la conexión con YouTube');
          }
        } else {
          toast.error('Error al verificar la conexión con YouTube');
        }
      } else {
        toast.error('Error de conexión');
      }
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTitle.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (shareTitle.length > 100) {
      toast.error('El título es demasiado largo (máx. 100 caracteres)');
      return;
    }
    if (shareDescription.length > 5000) {
      toast.error('La descripción es demasiado larga (máx. 5000 caracteres)');
      return;
    }
    setYtState('uploading');
    try {
      const job = await youtubeService.exportVideo(currentVideo.id, {
        title: shareTitle.trim(),
        description: shareDescription.trim() || null,
        tags: shareTags.trim() || null,
        privacyStatus: sharePrivacy,
      });
      startJobPolling(job.jobId);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const code = (err.response?.data as { code?: string })?.code;
        if (code === 'YOUTUBE_NOT_CONNECTED') {
          toast.error('Conecta tu cuenta de YouTube primero');
        } else if (code === 'VIDEO_NOT_READY_FOR_EXPORT') {
          toast.error('El video no está listo para exportar');
        } else {
          toast.error('Error al iniciar la subida a YouTube');
        }
      } else {
        toast.error('Error de conexión');
      }
      setYtState('form');
    }
  };

  /** Cierra el modal. Si la publicación fue exitosa, persiste la info en la card. */
  const handleModalClose = () => {
    if (ytState === 'done' && ytUrl) {
      const info = { url: ytUrl, privacy: sharePrivacy };
      setPublishedInfo(info);
      localStorage.setItem(
        `yt-published-${currentVideo.id}`,
        JSON.stringify(info)   // ← ahora info sí existe
      );
    }
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    setYtState('idle');
    setYtError(null);
    setYtUrl(null);
    setModalOpen(false);
  };
  // ─────────────────────────────────────────────────────────────────────

  const handleToggleFavorite = async () => {
    if (togglingFavorite) return;
    setTogglingFavorite(true);
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      if (next) {
        await favoriteService.addFavorite(currentVideo.id);
        toast.success('Agregado a favoritos');
      } else {
        await favoriteService.removeFavorite(currentVideo.id);
        toast.success('Eliminado de favoritos');
      }
      onFavoriteChange?.(currentVideo.id, next);
    } catch {
      setIsFavorite(!next);
      toast.error('No se pudo guardar el favorito. El servidor no está disponible.');
    } finally {
      setTogglingFavorite(false);
    }
  };

  const getShareableLink = (): { url: string; isYouTube: boolean } | null => {
    if (publishedInfo?.url) {
      return { url: publishedInfo.url, isYouTube: true };
    }
    if (currentVideo.signedUrl) {
      return { url: currentVideo.signedUrl, isYouTube: false };
    }
    return null;
  };

  const handleCopyLink = async () => {
    const link = getShareableLink();
    if (!link) {
      toast.error('El enlace no está disponible');
      return;
    }
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success(link.isYouTube ? 'Enlace de YouTube copiado' : 'Enlace del video copiado');
    } catch {
      toast.error('Tu navegador no permite copiar al portapapeles');
    }
  };

  const statusCfg = STATUS_CONFIG[currentVideo.status];
  const isCompleted = currentVideo.status === 'COMPLETED';

  return (
    <>
      {/* ── AÑADIDO: Modal de YouTube (fuera del card para evitar overflow) ── */}
      <YouTubeShareModal
        isOpen={modalOpen}
        video={currentVideo}
        shareTitle={shareTitle}
        shareDescription={shareDescription}
        shareTags={shareTags}
        sharePrivacy={sharePrivacy}
        onTitleChange={setShareTitle}
        onDescriptionChange={setShareDesc}
        onTagsChange={setShareTags}
        onPrivacyChange={setSharePrivacy}
        ytState={ytState}
        ytUrl={ytUrl}
        ytError={ytError}
        onSubmit={handleShareSubmit}
        onClose={handleModalClose}
        loadingSuggestions={loadingSuggestions}
      />
      {/* ─────────────────────────────────────────────────── */}

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
          {/* Badge original de estado del video — no modificado */}
          <div className={`status-badge ${statusCfg.className}`}>
            <span className="status-dot" />
            {statusCfg.label}
          </div>

          {/* ── AÑADIDO: Badge de publicación en YouTube ── */}
          {publishedInfo && (
            <div className="yt-published-badge">
              <span className="yt-published-dot">▶</span>
              <span className="yt-published-label">Publicado en YouTube</span>
              <span className="yt-published-privacy">
                {PRIVACY_LABEL[publishedInfo.privacy]}
              </span>
            </div>
          )}
          {/* ─────────────────────────── */}

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
            {/* ── AÑADIDO: botón YouTube con estado contextual ── */}
            {isCompleted && (
              publishedInfo ? (
                // Video ya publicado → "Ver en YouTube"
                <a
                  href={publishedInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-yt btn-sm btn-yt--published"
                >
                  <span className="yt-btn-icon-sm">▶</span>
                  Ver en YouTube
                </a>
              ) : (
                // Video no publicado → "Compartir en YouTube"
                <button
                  className="btn btn-yt btn-sm"
                  onClick={handleShareClick}
                  disabled={checkingConnection}
                >
                  {checkingConnection ? (
                    <span className="spinner spinner-sm" />
                  ) : (
                    'Compartir en YouTube'
                  )}
                </button>
              )
            )}
            {/* ─────────────────────────────────────────────── */}
            <button
              className={`btn-favorite${isFavorite ? ' btn-favorite--active' : ''}`}
              onClick={handleToggleFavorite}
              disabled={togglingFavorite}
              title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              {isFavorite ? '★' : '☆'}
            </button>
            {isCompleted && currentVideo.signedUrl && (
              <button
                className="btn btn-copy-link btn-sm"
                onClick={handleCopyLink}
                title="Copiar enlace del video"
              >
                Copiar enlace
              </button>
            )}
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(currentVideo.id)}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}