import { useState } from 'react';
import type { GenerateVideoRequest } from '../types/video.types';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface GenerateVideoFormProps {
  onGenerate: (request: GenerateVideoRequest) => Promise<void>;
  disabled: boolean;
  // TODO: Reactivar propiedades de cuota
  quotaReached?: boolean;
  videosGenerated?: number;
  videosLimit?: number;
}

const DURATIONS: Array<GenerateVideoRequest['durationSeconds']> = [4, 6, 8];
const MAX_PROMPT_LENGTH = 200;
const PROMPT_WARNING_THRESHOLD = 180;

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

  const { isSupported: voiceSupported, isListening, startListening, stopListening } =
    useVoiceInput({ onTranscript: setPrompt, currentText: prompt });

  const canSubmit =
    !disabled &&
    !quotaReached &&
    !loading &&
    prompt.trim().length > 0 &&
    prompt.length < MAX_PROMPT_LENGTH;

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
          <div className="form-label-row">
            <label className="form-label" htmlFor="video-prompt">
              Describe tu video
            </label>
            {voiceSupported && (
              <button
                type="button"
                className={`btn-mic${isListening ? ' btn-mic--active' : ''}`}
                onClick={isListening ? stopListening : startListening}
                disabled={disabled || quotaReached}
                title={isListening ? 'Detener grabación' : 'Dictar por voz'}
                aria-label={isListening ? 'Detener grabación' : 'Dictar por voz'}
              >
                {isListening ? '⏹' : '🎤'}
              </button>
            )}
          </div>
          <textarea
            id="video-prompt"
            className={`form-textarea${isListening ? ' form-textarea--listening' : ''}`}
            placeholder={isListening ? 'Escuchando…' : 'Ej: Un gato astronauta flotando en el espacio con la Tierra de fondo, estilo cinematográfico…'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={MAX_PROMPT_LENGTH}
            disabled={disabled || quotaReached}
            rows={3}
          />
          <span
            className="form-hint"
            style={
              prompt.length >= MAX_PROMPT_LENGTH
                ? { color: 'var(--error, #ef4444)', fontWeight: 600 }
                : prompt.length >= PROMPT_WARNING_THRESHOLD
                ? { color: 'var(--warning, #f59e0b)' }
                : undefined
            }
          >
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </span>
          {prompt.length >= MAX_PROMPT_LENGTH && (
            <span className="form-error-msg">
              Has alcanzado el límite máximo de caracteres (200).
            </span>
          )}
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
