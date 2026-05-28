import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { favoriteService } from '../services/favoriteService';
import { videoService } from '../services/videoService';
import { VideoCard } from '../components/VideoCard';
import type { VideoResponse } from '../types/video.types';
import type { PageResponse } from '../types/api.types';

const PAGE_SIZE = 6;

export function FavoritesPage() {
  const [videosData, setVideosData] = useState<PageResponse<VideoResponse> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await favoriteService.listFavorites(p, PAGE_SIZE);
      setVideosData(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(`Error al cargar favoritos (${error.response?.status ?? 'error'})`);
      } else {
        toast.error('Error al cargar favoritos.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFavorites(page);
  }, [page, loadFavorites]);

  const handleDelete = async (videoId: string) => {
    if (!confirm('¿Eliminar este video? Esta acción no se puede deshacer.')) return;
    try {
      await videoService.deleteVideo(videoId);
      toast.success('Video eliminado.');
      void loadFavorites(page);
    } catch {
      toast.error('Error al eliminar el video.');
    }
  };

  const handleFavoriteChange = (_videoId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      void loadFavorites(page);
    }
  };

  const videos = videosData?.content ?? [];
  const totalPages = videosData?.totalPages ?? 0;

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Favoritos</h1>
        <p className="dashboard-subtitle">Los videos que marcaste como favoritos</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => loadFavorites(page)}
          disabled={loading}
        >
          {loading ? <div className="spinner spinner-sm" /> : '↻ Recargar'}
        </button>
      </div>

      {loading && videos.length === 0 ? (
        <div className="text-center mt-1">
          <div className="spinner" style={{ margin: '2rem auto' }} />
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⭐</div>
          <p className="empty-state-text">
            Aún no tenés videos favoritos. Marcá un video con ★ para verlo aquí.
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
                onFavoriteChange={handleFavoriteChange}
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
