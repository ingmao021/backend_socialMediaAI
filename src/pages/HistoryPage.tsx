import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { videoService } from '../services/videoService';
import type { VideoResponse } from '../types/video.types';
import type { PageResponse } from '../types/api.types';

type StatusFilter = 'ALL' | 'COMPLETED' | 'PROCESSING' | 'FAILED';

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: 'Todos',
  COMPLETED: 'Completados',
  PROCESSING: 'En proceso',
  FAILED: 'Fallidos',
};

const STATUS_CONFIG = {
  PROCESSING: { label: 'Procesando', className: 'status-processing' },
  COMPLETED: { label: 'Completado', className: 'status-completed' },
  FAILED: { label: 'Error', className: 'status-failed' },
} as const;

function groupByDate(videos: VideoResponse[]): Map<string, VideoResponse[]> {
  const groups = new Map<string, VideoResponse[]>();
  for (const video of videos) {
    const key = new Date(video.createdAt).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const existing = groups.get(key) ?? [];
    existing.push(video);
    groups.set(key, existing);
  }
  return groups;
}

export function HistoryPage() {
  const [videosData, setVideosData] = useState<PageResponse<VideoResponse> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadVideos = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await videoService.listVideos(p, PAGE_SIZE);
      setVideosData(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(`Error al cargar el historial (${error.response?.status ?? 'error'})`);
      } else {
        toast.error('Error al cargar el historial.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVideos(page);
  }, [page, loadVideos]);

  const handleDelete = async (videoId: string) => {
    if (!confirm('¿Eliminar este video? Esta acción no se puede deshacer.')) return;
    try {
      await videoService.deleteVideo(videoId);
      toast.success('Video eliminado.');
      void loadVideos(page);
    } catch {
      toast.error('Error al eliminar el video.');
    }
  };

  const allVideos = videosData?.content ?? [];
  const filteredVideos = allVideos.filter((v) => {
    const statusMatch = filter === 'ALL' || v.status === filter;
    const dateMatch = !dateFilter || v.createdAt.substring(0, 10) === dateFilter;
    return statusMatch && dateMatch;
  });
  const totalPages = videosData?.totalPages ?? 0;
  const grouped = groupByDate(filteredVideos);

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Historial</h1>
        <p className="dashboard-subtitle">Todos los videos que generaste</p>
      </div>

      <div className="history-filters">
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((f) => (
          <button
            key={f}
            className={`history-filter-btn${filter === f ? ' history-filter-btn--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {STATUS_LABELS[f]}
          </button>
        ))}

        <div className="history-date-filter">
          <button
            className={`history-filter-btn history-calendar-btn${dateFilter ? ' history-filter-btn--active' : ''}`}
            onClick={() => setShowDatePicker((v) => !v)}
            title={dateFilter ? `Filtrando: ${dateFilter}` : 'Filtrar por fecha'}
          >
            📅{dateFilter ? ` ${dateFilter}` : ''}
          </button>
          {dateFilter && (
            <button
              className="history-clear-date"
              onClick={() => { setDateFilter(''); setShowDatePicker(false); }}
              title="Quitar filtro de fecha"
            >
              ✕
            </button>
          )}
          {showDatePicker && (
            <input
              type="date"
              className="history-date-input"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setShowDatePicker(false);
              }}
              autoFocus
              onBlur={() => setShowDatePicker(false)}
            />
          )}
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => loadVideos(page)}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          {loading ? <div className="spinner spinner-sm" /> : '↻ Recargar'}
        </button>
      </div>

      {loading && allVideos.length === 0 ? (
        <div className="text-center mt-1">
          <div className="spinner" style={{ margin: '2rem auto' }} />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">
            {dateFilter && filter !== 'ALL'
              ? `No hay videos "${STATUS_LABELS[filter]}" el ${dateFilter}.`
              : dateFilter
              ? `No hay videos el ${dateFilter}.`
              : filter !== 'ALL'
              ? `No hay videos con estado "${STATUS_LABELS[filter]}".`
              : 'No hay videos en tu historial.'}
          </p>
        </div>
      ) : (
        <>
          {Array.from(grouped.entries()).map(([date, videos]) => (
            <div key={date} className="history-group">
              <h3 className="history-group-date">{date}</h3>
              <div className="history-list">
                {videos.map((video) => {
                  const statusCfg = STATUS_CONFIG[video.status];
                  return (
                    <div key={video.id} className="history-item glass-card">
                      <div className="history-item-left">
                        <div className={`status-badge ${statusCfg.className}`}>
                          <span className="status-dot" />
                          {statusCfg.label}
                        </div>
                        <p className="history-item-prompt" title={video.prompt}>
                          {video.prompt}
                        </p>
                      </div>
                      <div className="history-item-right">
                        <span className="history-item-meta">{video.durationSeconds}s</span>
                        <span className="history-item-meta">
                          {new Date(video.createdAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(video.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

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
