import { ReactNode, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface DragDropData {
  type: string;
  id?: string;
  issueType?: string;
}

interface DropZoneProps {
  children: ReactNode;
  onDrop: (data: DragDropData) => void;
  className?: string;
  isHighlighted?: boolean;
}

export default function DropZone({
  children,
  onDrop,
  className,
  isHighlighted: externalHighlight,
}: DropZoneProps) {
  const [isInternalHighlight, setIsInternalHighlight] = useState(false);
  const [, setDragCounter] = useState(0);

  const isHighlighted = externalHighlight ?? isInternalHighlight;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => prev + 1);
    setIsInternalHighlight(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        setIsInternalHighlight(false);
        return 0;
      }
      return next;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsInternalHighlight(false);
      setDragCounter(0);

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const parsed = JSON.parse(data) as DragDropData;
        if (parsed && typeof parsed.type === 'string') {
          onDrop(parsed);
        }
      } catch {
        // ignore parse errors
      }
    },
    [onDrop]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative transition-all duration-200 rounded-xl',
        isHighlighted &&
          'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/50 border-blue-300',
        className
      )}
    >
      {children}
    </div>
  );
}
