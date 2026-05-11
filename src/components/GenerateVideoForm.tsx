import { useState } from 'react';
import type { GenerateVideoRequest } from '../types/video.types';

interface GenerateVideoFormProps {
  onGenerate: (request: GenerateVideoRequest) => Promise<void>;
  disabled: boolean;
  // TODO: Reactivar propiedades de cuota
  quotaReached?: boolean;
  videosGenerated?: number;
  videosLimit?: number;
}

const DURATIONS: Array<GenerateVideoRequest['durationSeconds']> = [4, 6, 8];
const MAX_PROMPT_LENGTH = 2000;

export function GenerateVideoForm({
  onGenerate,
  disabled,
  quotaReached,
  videosGenerated,
  videosLimit,
}: GenerateVideoFormProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<GenerateVideoRequest['durationSeconds']>(4);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    !disabled &&
    !quotaReached &&
    !loading &&
    prompt.trim().length > 0 &&
    prompt.length <= MAX_PROMPT_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      await onGenerate({ prompt: prompt.trim(), durationSeconds: duration });
      setPrompt('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="generate-section glass-card">
      <form className="generate-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="video-prompt">
            Describe tu video
          </label>
          <textarea
            id="video-prompt"
            className="form-textarea"
            placeholder="Ej: Un gato astronauta flotando en el espacio con la Tierra de fondo, estilo cinematográfico…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={MAX_PROMPT_LENGTH}
            disabled={disabled || quotaReached}
            rows={3}
          />
          <span className="form-hint">
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Duración</label>
          <div className="duration-selector">
            {DURATIONS.map((d) => (
              <label className="duration-option" key={d}>
                <input
                  type="radio"
                  name="duration"
                  value={d}
                  checked={duration === d}
                  onChange={() => setDuration(d)}
                  disabled={disabled || quotaReached}
                />
                <span>{d}s</span>
              </label>
            ))}
          </div>
        </div>

        {quotaReached && (
          <div className="quota-warning">
            <span className="quota-warning-icon">⚠️</span>
            <span>
              Has alcanzado tu límite gratuito ({videosGenerated}/{videosLimit}{' '}
              videos). Suscríbete para seguir generando.
            </span>
          </div>
        )}

        <div className="generate-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit}
            id="generate-video-btn"
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm" />
                Generando…
              </>
            ) : (
              '✨ Generar video'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
