import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePracticeStore } from '@/store/usePracticeStore';
import { Patient } from '@/types';
import {
  ClipboardCheck,
  X,
  FileText,
  AlertTriangle,
  Receipt,
  Lightbulb,
  CheckCircle2,
  ChevronUp,
} from 'lucide-react';

interface SelfCheckPanelProps {
  patients: Patient[];
  unmatchedReceiptCount: number;
  className?: string;
  noFixed?: boolean;
}

export default function SelfCheckPanel({ patients, unmatchedReceiptCount, className, noFixed = false }: SelfCheckPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const matchedReceipts = usePracticeStore((state) => state.matchedReceipts);
  const patientIssues = usePracticeStore((state) => state.patientIssues);

  const stats = useMemo(() => {
    const patientsWithoutReceipts = patients.filter(
      (p) => !matchedReceipts[p.id] || matchedReceipts[p.id].length === 0
    );

    const patientsWithoutIssues = patients.filter(
      (p) => !patientIssues[p.id] || patientIssues[p.id].length === 0
    );

    return {
      patientsWithoutReceiptsCount: patientsWithoutReceipts.length,
      patientsWithoutIssuesCount: patientsWithoutIssues.length,
      allReceiptsMatched: patientsWithoutReceipts.length === 0,
      allIssuesMarked: patientsWithoutIssues.length === 0,
    };
  }, [patients, matchedReceipts, patientIssues]);

  const totalChecks = 3;
  const completedChecks = [
    stats.allReceiptsMatched,
    stats.allIssuesMarked,
    unmatchedReceiptCount === 0,
  ].filter(Boolean).length;

  return (
    <div
      className={cn(
        'flex flex-col items-end gap-3',
        !noFixed && 'fixed bottom-24 right-6 z-40',
        className
      )}
    >
      {isOpen && (
        <div className="w-80 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden animate-slide-up">
          <div className="px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">提交前自查</h3>
                <p className="text-blue-100 text-xs">
                  已完成 {completedChecks} / {totalChecks} 项
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                stats.allReceiptsMatched
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  stats.allReceiptsMatched ? 'bg-green-100' : 'bg-orange-100'
                )}
              >
                {stats.allReceiptsMatched ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <FileText className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-medium text-sm',
                    stats.allReceiptsMatched ? 'text-green-700' : 'text-orange-700'
                  )}
                >
                  凭证匹配检查
                </p>
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    stats.allReceiptsMatched ? 'text-green-600' : 'text-orange-600'
                  )}
                >
                  {stats.allReceiptsMatched
                    ? '✅ 所有患者都已匹配凭证'
                    : `还有 ${stats.patientsWithoutReceiptsCount} 位患者没有匹配任何凭证`}
                </p>
              </div>
            </div>

            <div
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                stats.allIssuesMarked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  stats.allIssuesMarked ? 'bg-green-100' : 'bg-orange-100'
                )}
              >
                {stats.allIssuesMarked ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-medium text-sm',
                    stats.allIssuesMarked ? 'text-green-700' : 'text-orange-700'
                  )}
                >
                  问题标记检查
                </p>
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    stats.allIssuesMarked ? 'text-green-600' : 'text-orange-600'
                  )}
                >
                  {stats.allIssuesMarked
                    ? '✅ 所有患者都已标记问题'
                    : `还有 ${stats.patientsWithoutIssuesCount} 位患者没有标记任何问题`}
                </p>
              </div>
            </div>

            <div
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                unmatchedReceiptCount === 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  unmatchedReceiptCount === 0 ? 'bg-green-100' : 'bg-amber-100'
                )}
              >
                {unmatchedReceiptCount === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Receipt className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-medium text-sm',
                    unmatchedReceiptCount === 0 ? 'text-green-700' : 'text-amber-700'
                  )}
                >
                  凭证剩余检查
                </p>
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    unmatchedReceiptCount === 0 ? 'text-green-600' : 'text-amber-600'
                  )}
                >
                  {unmatchedReceiptCount === 0
                    ? '✅ 所有凭证都已匹配'
                    : `还剩 ${unmatchedReceiptCount} 张凭证未匹配`}
                </p>
                {unmatchedReceiptCount > 0 && (
                  <p className="text-xs text-amber-600/80 mt-1">
                    请确认是否有干扰凭证或漏匹配
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-blue-700">温馨提示</p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• 有些患者可能没有问题，是正常收款哦～</li>
                    <li>• 干扰凭证不需要匹配给任何患者</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              收起面板
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 h-12 px-5 rounded-full font-medium shadow-xl transition-all duration-200',
          isOpen
            ? 'bg-white text-gray-700 border border-gray-200 shadow-card hover:bg-gray-50'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 active:scale-[0.98]'
        )}
      >
        <ClipboardCheck className="w-5 h-5" />
        自查一下
      </button>
    </div>
  );
}
