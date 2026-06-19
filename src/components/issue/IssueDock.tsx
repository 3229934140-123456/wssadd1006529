import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { IssueType, ISSUE_TYPE_LABELS, ISSUE_TYPE_COLORS } from '@/types';
import { GripVertical, AlertTriangle, AlertCircle } from 'lucide-react';

const ALL_ISSUE_TYPES: IssueType[] = [
  'not_received',
  'duplicate_payment',
  'missing_invoice',
  'refund_not_recorded',
  'amount_mismatch',
  'discount_not_approved',
  'wrong_payment_method',
];

export default function IssueDock() {
  const handleDragStart = useCallback(
    (e: React.DragEvent, issueType: IssueType) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({ type: 'issue', issueType })
      );
    },
    []
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-600 shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium">问题标签</span>
          </div>
          <div className="h-6 w-px bg-gray-200 shrink-0" />
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {ALL_ISSUE_TYPES.map((issue) => {
              const colorClasses =
                ISSUE_TYPE_COLORS[issue] || ISSUE_TYPE_COLORS.not_received;
              return (
                <div
                  key={issue}
                  draggable
                  onDragStart={(e) => handleDragStart(e, issue)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm',
                    colorClasses,
                    'hover:shadow-md hover:scale-105'
                  )}
                >
                  <GripVertical className="w-3 h-3 opacity-60 -ml-1" />
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{ISSUE_TYPE_LABELS[issue]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
