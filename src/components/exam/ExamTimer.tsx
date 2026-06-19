import { useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  totalSeconds: number;
  isRunning?: boolean;
  onTimeUp?: () => void;
  onTimeWarning?: () => void;
  className?: string;
}

export function ExamTimer({
  totalSeconds,
  isRunning = false,
  onTimeUp,
  onTimeWarning,
  className,
}: ExamTimerProps) {
  const hasWarnedRef = useRef(false);

  const { remainingSeconds, isExpired } = useCountdown({
    initialSeconds: totalSeconds,
    isRunning,
    onComplete: onTimeUp,
  });

  const warningThreshold = totalSeconds / 3;
  const criticalThreshold = 60;

  const isWarning = remainingSeconds > 0 && remainingSeconds <= warningThreshold;
  const isCritical = remainingSeconds > 0 && remainingSeconds <= criticalThreshold;

  useEffect(() => {
    if (isWarning && !hasWarnedRef.current && onTimeWarning) {
      hasWarnedRef.current = true;
      onTimeWarning();
    }
    if (!isWarning) {
      hasWarnedRef.current = false;
    }
  }, [isWarning, onTimeWarning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isExpired) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-2',
          'bg-red-50 text-red-600 ring-1 ring-red-200',
          'shadow-card font-bold',
          className
        )}
      >
        <AlertTriangle className="h-5 w-5" />
        <span className="font-mono text-lg font-semibold">时间到！</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2',
        'shadow-card transition-colors',
        'font-mono text-lg font-semibold tabular-nums',
        {
          'bg-primary-50 text-primary-600 ring-1 ring-primary-200': !isWarning && !isCritical,
          'bg-amber-50 text-amber-600 ring-1 ring-amber-200 animate-pulse': isWarning && !isCritical,
          'bg-red-50 text-red-600 ring-1 ring-red-200': isCritical,
        },
        className
      )}
      style={isCritical ? { animation: 'critical-blink 0.5s ease-in-out infinite' } : undefined}
    >
      <Clock
        className={cn('h-5 w-5', {
          'animate-spin': false,
        })}
      />
      <span className="tabular-nums">{formatTime(remainingSeconds)}</span>
      <style>{`
        @keyframes critical-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default ExamTimer;
