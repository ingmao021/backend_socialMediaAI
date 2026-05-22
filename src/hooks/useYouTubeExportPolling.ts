import { useEffect, useRef, useState } from 'react';
import { youtubeService } from '../services/youtubeService';
import type { YouTubeExportJobResponse } from '../types/youtube.types';

export interface UseYouTubeExportPollingOptions {
  jobId: string | null;
  intervalMs?: number;
  onCompleted?: (job: YouTubeExportJobResponse) => void;
  onFailed?: (job: YouTubeExportJobResponse) => void;
}

export interface UseYouTubeExportPollingResult {
  job: YouTubeExportJobResponse | null;
  isPolling: boolean;
  progress: number | null;
}

export function useYouTubeExportPolling(
  options: UseYouTubeExportPollingOptions,
): UseYouTubeExportPollingResult {
  const { jobId, intervalMs = 2000, onCompleted, onFailed } = options;

  const [job, setJob] = useState<YouTubeExportJobResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
    onFailedRef.current = onFailed;
  }, [onCompleted, onFailed]);

  useEffect(() => {
    if (!jobId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJob(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPolling(false);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPolling(true);
    let intervalHandle: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const data = await youtubeService.getExportJob(jobId);
        setJob(data);

        if (data.status === 'COMPLETED') {
          if (intervalHandle) clearInterval(intervalHandle);
          setIsPolling(false);
          onCompletedRef.current?.(data);
        } else if (data.status === 'FAILED') {
          if (intervalHandle) clearInterval(intervalHandle);
          setIsPolling(false);
          onFailedRef.current?.(data);
        }
      } catch {
        // Transient error — continue polling
      }
    };

    poll();
    intervalHandle = setInterval(poll, intervalMs);

    return () => {
      if (intervalHandle) clearInterval(intervalHandle);
    };
  }, [jobId, intervalMs]);

  const progress = job?.progressPercent ?? (
    job?.bytesTotal && job.bytesTotal > 0
      ? Math.round((job.bytesUploaded / job.bytesTotal) * 100)
      : null
  );

  return { job, isPolling, progress };
}