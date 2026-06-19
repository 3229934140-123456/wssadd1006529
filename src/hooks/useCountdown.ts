import { useState, useEffect, useRef } from 'react';

interface UseCountdownOptions {
  initialSeconds: number;
  isRunning: boolean;
  onComplete?: () => void;
}

interface UseCountdownResult {
  remainingSeconds: number;
  isExpired: boolean;
  progress: number;
}

export function useCountdown({
  initialSeconds,
  isRunning,
  onComplete,
}: UseCountdownOptions): UseCountdownResult {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    setRemainingSeconds(initialSeconds);
    hasCompletedRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    if (remainingSeconds <= 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onComplete?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, onComplete]);

  const progress = initialSeconds > 0
    ? Math.max(0, Math.min(1, (initialSeconds - remainingSeconds) / initialSeconds))
    : 0;

  return {
    remainingSeconds,
    isExpired: remainingSeconds <= 0,
    progress,
  };
}
