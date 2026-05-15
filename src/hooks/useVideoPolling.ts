import { useEffect, useRef, useState, useCallback } from 'react';
import { videoService } from '../services/videoService';
import type { VideoStatus } from '../types/video.types';
import axios from 'axios';

export interface UseVideoPollingOptions {
  videoId: string | null;
  intervalMs?: number;   // default 5000 (PRD: polling cada 5s)
  timeoutMs?: number;    // default 1500000 (25 min)
  onComplete?: (signedUrl: string) => void;
  onFailed?: (errorMessage: string) => void;
}

export interface UseVideoPollingResult {
  status: VideoStatus | null;
  signedUrl: string | null;
  error: string | null;
  isPolling: boolean;
}

export function useVideoPolling(
  options: UseVideoPollingOptions,
): UseVideoPollingResult {
  const {
    videoId,
    intervalMs = 5000,  // PRD: polling cada 5s
    timeoutMs = 1500000,
    onComplete,
    onFailed,
  } = options;

  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Refs to hold the latest callbacks without triggering re-renders
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onFailedRef.current = onFailed;
  }, [onComplete, onFailed]);

  // Reset state when videoId changes
  const reset = useCallback(() => {
    setStatus(null);
    setSignedUrl(null);
    setError(null);
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!videoId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      reset();
      return;
    }

    // Fresh start for a new videoId
     
    setStatus(null);
     
    setSignedUrl(null);
     
    setError(null);
     
    setIsPolling(true);

    let intervalHandle: ReturnType<typeof setInterval> | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const cleanup = () => {
      cancelled = true;
      if (intervalHandle) clearInterval(intervalHandle);
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };

    const poll = async () => {
      if (cancelled) return;

      try {
        const response = await videoService.getVideoStatus(videoId);

        if (cancelled) return;

        setStatus(response.status);

        if (response.status === 'COMPLETED') {
          setSignedUrl(response.signedUrl);
          setIsPolling(false);
          cleanup();
          onCompleteRef.current?.(response.signedUrl ?? '');
        } else if (response.status === 'FAILED') {
          setIsPolling(false);
          cleanup();
          onFailedRef.current?.(response.errorMessage ?? 'La generación del video ha fallado.');
        }
        // If still PROCESSING, keep polling
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const statusCode = err.response?.status;
          console.error('[video-poll] axios error', { videoId, statusCode, data: err.response?.data });
          if (statusCode === 404) {
            cleanup();
            setIsPolling(false);
            setError('Video no encontrado.');
            onFailedRef.current?.('Video no encontrado.');
            return;
          }

          // Eliminar el comportamiento que detenía el polling por errores 5xx
          // El polling debe continuar ante fallas intermitentes del servidor
        }

        // Otros errores de red/transitorios: loguear y seguir reintentando hasta timeout
        console.error('[video-poll] transient error (will retry):', { videoId, err });
      }
    };

    // Do an initial poll immediately, then every intervalMs
    poll();
    intervalHandle = setInterval(poll, intervalMs);

    // Timeout: stop polling if it takes too long
    timeoutHandle = setTimeout(() => {
      if (cancelled) return;
      cleanup();
      setIsPolling(false);
      setError(
        'La generación del video está tomando más tiempo del esperado. Recarga la página para verificar el estado.',
      );
    }, timeoutMs);

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, intervalMs, timeoutMs]);

  return { status, signedUrl, error, isPolling };
}
