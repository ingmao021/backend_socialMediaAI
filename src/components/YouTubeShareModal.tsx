import React from 'react';
import type { YouTubePrivacyStatus } from '../types/youtube.types';
import type { VideoResponse } from '../types/video.types';

type YtState = 'idle' | 'form' | 'uploading' | 'done' | 'error';

interface YouTubeShareModalProps {
  isOpen: boolean;
  video: VideoResponse;
  // Form state
  shareTitle: string;
  shareDescription: string;
  sharePrivacy: YouTubePrivacyStatus;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (desc: string) => void;
  onPrivacyChange: (privacy: YouTubePrivacyStatus) => void;
  // YouTube flow state
  ytState: YtState;
  ytProgress: number | null;
  ytUrl: string | null;
  ytError: string | null;
  checkingConnection: boolean;
  // Callbacks — lógica intacta, solo envuelve en modal
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

/** Deriva el paso de upload visible a partir del estado interno */
function deriveStep(ytState: YtState, ytProgress: number | null): number {
  if (ytState !== 'uploading') return 0;
  if (ytProgress === null) return 1;        // PENDING → Conectando
  if (ytProgress < 100) return 2;           // UPLOADING → Subiendo
  return 3;                                  // 100% → Procesando
}

const STEPS = [
  { label: 'Conectando cuenta', icon: '🔗' },
  { label: 'Subiendo video', icon: '⬆️' },
  { label: 'Procesando', icon: '⚙️' },
];

const PRIVACY_OPTIONS: { value: YouTubePrivacyStatus; label: string; icon: string; desc: string }[] = [
  { value: 'PRIVATE', label: 'Privado', icon: '🔒', desc: 'Solo tú puedes verlo' },
  { value: 'UNLISTED', label: 'No listado', icon: '🔗', desc: 'Solo quien tenga el enlace' },
  { value: 'PUBLIC', label: 'Público', icon: '🌐', desc: 'Cualquiera puede verlo' },
];

export function YouTubeShareModal({
  isOpen,
  video,
  shareTitle,
  shareDescription,
  sharePrivacy,
  onTitleChange,
  onDescriptionChange,
  onPrivacyChange,
  ytState,
  ytProgress,
  ytUrl,
  ytError,
  checkingConnection,
  onSubmit,
  onClose,
}: YouTubeShareModalProps) {
  if (!isOpen) return null;

  const step = deriveStep(ytState, ytProgress);
  const isUploading = ytState === 'uploading';
  const isDone = ytState === 'done';
  const isError = ytState === 'error';
  const isForm = ytState === 'form' || ytState === 'idle';

  return (
    <div className="yt-modal-overlay" onClick={isUploading ? undefined : onClose} role="dialog" aria-modal="true" aria-label="Compartir en YouTube">
      <div className="yt-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="yt-modal-header">
          <div className="yt-modal-header-left">
            <span className="yt-modal-logo">▶</span>
            <span className="yt-modal-title">
              {isDone ? '¡Video publicado!' : isUploading ? 'Publicando en YouTube…' : 'Compartir en YouTube'}
            </span>
          </div>
          {!isUploading && (
            <button className="yt-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
          )}
        </div>

        {/* ══════════════════════════════════════════
            ESTADO: formulario
        ══════════════════════════════════════════ */}
        {isForm && (
          <form onSubmit={onSubmit} className="yt-modal-body">
            {/* Mini preview */}
            {video.signedUrl && (
              <div className="yt-modal-preview">
                <video
                  src={video.signedUrl}
                  className="yt-modal-video"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="yt-modal-preview-overlay">
                  <span className="yt-modal-duration">{video.durationSeconds}s</span>
                </div>
              </div>
            )}

            {/* Título */}
            <div className="yt-modal-field">
              <label className="yt-modal-label" htmlFor="yt-title">Título *</label>
              <input
                id="yt-title"
                className="yt-modal-input"
                type="text"
                value={shareTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Título del video en YouTube"
                maxLength={100}
                required
              />
              <span className="yt-modal-counter">{shareTitle.length}/100</span>
            </div>

            {/* Descripción */}
            <div className="yt-modal-field">
              <label className="yt-modal-label" htmlFor="yt-desc">Descripción</label>
              <textarea
                id="yt-desc"
                className="yt-modal-textarea"
                value={shareDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Describe tu video (opcional)"
                maxLength={500}
                rows={3}
              />
              <span className="yt-modal-counter">{shareDescription.length}/500</span>
            </div>

            {/* Privacidad */}
            <div className="yt-modal-field">
              <label className="yt-modal-label">Visibilidad</label>
              <div className="yt-privacy-grid">
                {PRIVACY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`yt-privacy-option ${sharePrivacy === opt.value ? 'yt-privacy-option--active' : ''}`}
                    onClick={() => onPrivacyChange(opt.value)}
                  >
                    <span className="yt-privacy-icon">{opt.icon}</span>
                    <span className="yt-privacy-label">{opt.label}</span>
                    <span className="yt-privacy-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div className="yt-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-yt-modal" disabled={!shareTitle.trim()}>
                <span className="yt-btn-icon">▶</span>
                Publicar en YouTube
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════
            ESTADO: subiendo
        ══════════════════════════════════════════ */}
        {isUploading && (
          <div className="yt-modal-body yt-modal-uploading-simple">
            <div className="spinner yt-upload-spinner" />
            <p className="yt-uploading-text">Publicando en YouTube…</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            ESTADO: publicado ✅
        ══════════════════════════════════════════ */}
        {isDone && ytUrl && (
          <div className="yt-modal-body yt-modal-done-body">
            <div className="yt-done-icon-big">✅</div>
            <h3 className="yt-done-title">¡Publicado en YouTube!</h3>
            <p className="yt-done-sub">
              Tu video ya está disponible en tu canal con visibilidad&nbsp;
              <strong>
                {PRIVACY_OPTIONS.find((p) => p.value === sharePrivacy)?.label ?? sharePrivacy}
              </strong>.
            </p>
            <div className="yt-modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>
              <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="btn btn-yt-modal">
                <span className="yt-btn-icon">▶</span>
                Ver en YouTube
              </a>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            ESTADO: error ⚠️
        ══════════════════════════════════════════ */}
        {isError && (
          <div className="yt-modal-body yt-modal-error-body">
            <div className="yt-error-icon-big">⚠️</div>
            <h3 className="yt-error-title">No se pudo publicar</h3>
            <p className="yt-error-msg">{ytError ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.'}</p>
            <div className="yt-modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-yt-modal" onClick={onClose}>
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}