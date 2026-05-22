import { useState, useEffect, useCallback } from 'react';
import { youtubeService } from '../services/youtubeService';
import type { YouTubeConnectionResponse } from '../types/youtube.types';

export interface UseYouTubeConnectionResult {
  connection: YouTubeConnectionResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useYouTubeConnection(): UseYouTubeConnectionResult {
  const [connection, setConnection] = useState<YouTubeConnectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await youtubeService.getConnection();
      setConnection(data);
    } catch {
      setError('No se pudo verificar la conexión con YouTube.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  return { connection, loading, error, refetch };
}