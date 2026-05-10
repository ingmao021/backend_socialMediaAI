import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getToken } from '../utils/tokenStorage';
import { useAuth } from '../hooks/useAuth';
import { useVideoPolling } from '../hooks/useVideoPolling';
import { videoService } from '../services/videoService';
import { GenerateVideoForm } from '../components/GenerateVideoForm';
import { VideoCard } from '../components/VideoCard';
import type { GenerateVideoRequest, VideoResponse } from '../types/video.types';
import type { ApiError, PageResponse } from '../types/api.types';

const PAGE_SIZE = 6;

export function DashboardPage() {
  const { user, refreshUser } = useAuth();

  const [videosData, setVideosData] = useState<PageResponse<VideoResponse> | null>(null);
  const [page, setPage] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [pollingVideoId, setPollingVideoId] = useState<string | null>(null);

  const quotaReached = (user?.videosGenerated ?? 0) >= (user?.videosLimit ?? 2);

  // Load video list
  const loadVideos = useCallback(
    async (p: number = 0) => {
      setLoadingList(true);
      try {
        const token = getToken();
        const data = await videoService.listVideos(p, PAGE_SIZE);

        // Debug: log response and token presence to help diagnose missing videos
        try {
          // eslint-disable-next-line no-console
          console.info('[videos] Request details:', {
            page: p,
            pageSize: PAGE_SIZE,
            tokenPresent: !!token,
            tokenValue: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
          });
          // eslint-disable-next-line no-console
          console.info('[videos] Backend response:', {
            totalElements: data.totalElements,
            totalPages: data.totalPages,
            contentCount: data.content?.length || 0,
            content: data.content,
          });
        } catch (e) {
          // ignore logging errors
        }

        // Asegurar que se mapea correctamente response.data.content
        setVideosData(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[videos] Error loading videos:', error);

        // Si es un error de autenticación
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status;
          const errorData = error.response?.data as ApiError | undefined;

          if (statusCode === 401 || statusCode === 403) {
            // eslint-disable-next-line no-console
            console.error('[videos] Authentication error (401/403):', {
              statusCode,
              message: errorData?.message,
              noToken: !getToken(),
            });
            toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
          } else {
            toast.error(`Error al cargar los videos (${statusCode || 'error'})`);
          }
        } else {
          toast.error('Error al cargar los videos.');
        }
      } finally {
        setLoadingList(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadVideos(page);
  }, [page, loadVideos]);

  // Recargar videos cuando el usuario cambia (después de login)
  useEffect(() => {
    if (user && !pollingVideoId) {
      loadVideos(0);
      setPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, pollingVideoId]);

  // Polling for the most recently generated video
  useVideoPolling({
    videoId: pollingVideoId,
    onComplete: () => {
      toast.success('¡Video generado exitosamente!');
      setPollingVideoId(null);
      loadVideos(0);
      setPage(0);
      refreshUser();
    },
    onFailed: (msg) => {
      toast.error(msg || 'Error al generar el video.');
      setPollingVideoId(null);
      loadVideos(page);
    },
  });

  async function handleGenerate(request: GenerateVideoRequest) {
    try {
      const video = await videoService.generateVideo(request);
      toast.success('Video en cola de generación.');
      setPollingVideoId(video.id);
      // Refresh list to show the new PROCESSING video
      await loadVideos(0);
      setPage(0);
      await refreshUser();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const code = (err.response?.data as ApiError | undefined)?.code;
        if (code === 'QUOTA_EXCEEDED') {
          toast.error('Has alcanzado el límite de videos.');
          refreshUser();
        } else if (code === 'VALIDATION_ERROR') {
          toast.error('Prompt o duración inválidos.');
        } else {
          toast.error('Error al generar el video.');
        }
      } else {
        toast.error('Error de conexión.');
      }
    }
  }

  async function handleDelete(videoId: string) {
    if (!confirm('¿Eliminar este video? Esta acción no se puede deshacer.')) return;

    try {
      await videoService.deleteVideo(videoId);
      toast.success('Video eliminado.');
      await loadVideos(page);
      await refreshUser();
    } catch {
      toast.error('Error al eliminar el video.');
    }
  }

  const videos = videosData?.content ?? [];
  const totalPages = videosData?.totalPages ?? 0;

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          Escribí un prompt y generá videos con IA
        </p>
      </div>

      <GenerateVideoForm
        onGenerate={handleGenerate}
        disabled={!!pollingVideoId}
        quotaReached={quotaReached}
        videosGenerated={user?.videosGenerated ?? 0}
        videosLimit={user?.videosLimit ?? 2}
      />

      <div className="video-list-header">
        <h2 className="video-list-title">Tus videos</h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => loadVideos(page)}
          disabled={loadingList}
        >
          {loadingList ? <div className="spinner spinner-sm" /> : '↻ Recargar'}
        </button>
      </div>

      {loadingList && videos.length === 0 ? (
        <div className="text-center mt-1">
          <div className="spinner" style={{ margin: '2rem auto' }} />
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <p className="empty-state-text">
            Aún no generaste ningún video. ¡Probá con tu primer prompt!
          </p>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary pagination-btn"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-secondary pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
