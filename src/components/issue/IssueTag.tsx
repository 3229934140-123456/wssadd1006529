import { cn } from '@/lib/utils';
import {
  IssueType,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPE_COLORS,
} from '@/types';
import { GripVertical, AlertTriangle, X } from 'lucide-react';

interface IssueTagProps {
  issue: IssueType;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, issue: IssueType) => void;
  onClick?: () => void;
  onRemove?: () => void;
  selected?: boolean;
}

export default function IssueTag({
  issue,
  draggable,
  onDragStart,
  onClick,
  onRemove,
  selected,
}: IssueTagProps) {
  const colorClasses = ISSUE_TYPE_COLORS[issue] || ISSUE_TYPE_COLORS.not_received;

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        if (onDragStart) onDragStart(e, issue);
        if (draggable) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/issue', issue);
        }
      }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200',
        colorClasses,
        draggable && 'cursor-grab active:cursor-grabbing shadow-sm',
        onClick && !onRemove && 'cursor-pointer hover:shadow-md hover:scale-105',
        selected && 'ring-2 ring-offset-1 ring-current scale-105 shadow-md'
      )}
    >
      {draggable && (
        <GripVertical className="w-3 h-3 opacity-60 -ml-1" />
      )}
      {!draggable && !onRemove && (
        <AlertTriangle className="w-3 h-3 shrink-0" />
      )}
      <span>{ISSUE_TYPE_LABELS[issue]}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded hover:bg-black/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
