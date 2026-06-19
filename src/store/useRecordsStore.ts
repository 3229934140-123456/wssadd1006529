import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PracticeRecord, RecordsState, IssueType, ISSUE_TYPE_LABELS, OperationErrorType, OPERATION_ERROR_LABELS, TrainingPlan } from '../types';

const STORAGE_KEY = 'dental-reconciliation-records';

const initialWrongStats = (): Record<IssueType, number> => ({
  not_received: 0,
  duplicate_payment: 0,
  missing_invoice: 0,
  refund_not_recorded: 0,
  amount_mismatch: 0,
  discount_not_approved: 0,
  wrong_payment_method: 0,
});

const initialOperationErrorStats = (): Record<OperationErrorType, number> => ({
  match_error: 0,
  wrong_issue: 0,
  missing_issue: 0,
  amount_judgment: 0,
});

export const useRecordsStore = create<RecordsState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record: PracticeRecord) =>
        set((state) => ({
          records: [record, ...state.records],
        })),

      clearRecords: () => set({ records: [] }),

      getRecordsBySceneId: (sceneId: string) => {
        return get().records.filter((r) => r.sceneId === sceneId);
      },

      getLatestRecordBySceneId: (sceneId: string) => {
        const records = get().records.filter((r) => r.sceneId === sceneId);
        return records.length > 0 ? records[0] : null;
      },

      getAverageScore: () => {
        const records = get().records;
        if (records.length === 0) return 0;
        const total = records.reduce((sum, r) => sum + r.score, 0);
        return Math.round(total / records.length);
      },

      getTotalPracticeCount: () => {
        return get().records.length;
      },

      getWrongIssueTypeStats: () => {
        const records = get().records;
        const stats = initialWrongStats();

        records.forEach((record) => {
          record.wrongIssueTypes.forEach((issue) => {
            stats[issue] = (stats[issue] || 0) + 1;
          });
        });

        return stats;
      },

      getOperationErrorStats: () => {
        const records = get().records;
        const stats = initialOperationErrorStats();

        records.forEach((record) => {
          (record.operationErrors || []).forEach((err) => {
            stats[err] = (stats[err] || 0) + 1;
          });
        });

        return stats;
      },

      updateTrainingPlan: (recordId: string, plan: TrainingPlan) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId ? { ...r, trainingPlan: plan } : r
          ),
        })),

      completeTrainingPlan: (recordId: string) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId && r.trainingPlan
              ? {
                  ...r,
                  trainingPlan: {
                    ...r.trainingPlan,
                    isCompleted: true,
                    completedAt: Date.now(),
                  },
                }
              : r
          ),
        })),

      getPendingTrainingPlans: () => {
        return get().records.filter(
          (r) => r.trainingPlan && !r.trainingPlan.isCompleted
        );
      },

      getSceneStats: () => {
        const records = get().records;
        const sceneMap = new Map<string, PracticeRecord[]>();
        records.forEach((r) => {
          if (!sceneMap.has(r.sceneId)) {
            sceneMap.set(r.sceneId, []);
          }
          sceneMap.get(r.sceneId)!.push(r);
        });

        const result: Record<string, { avgScore: number; passRate: number; count: number; recentTrend: 'up' | 'down' | 'stable' }> = {};
        sceneMap.forEach((sceneRecords, sceneId) => {
          const avgScore = Math.round(sceneRecords.reduce((s, r) => s + r.score, 0) / sceneRecords.length);
          const passCount = sceneRecords.filter((r) => r.isPassed).length;
          const passRate = Math.round((passCount / sceneRecords.length) * 100);

          const sorted = [...sceneRecords].sort((a, b) => a.completedAt - b.completedAt);
          let recentTrend: 'up' | 'down' | 'stable' = 'stable';
          if (sorted.length >= 3) {
            const recent3 = sorted.slice(-3);
            const firstAvg = (recent3[0].score + recent3[1].score) / 2;
            const lastAvg = (recent3[1].score + recent3[2].score) / 2;
            if (lastAvg > firstAvg + 5) recentTrend = 'up';
            else if (lastAvg < firstAvg - 5) recentTrend = 'down';
          }

          result[sceneId] = { avgScore, passRate, count: sceneRecords.length, recentTrend };
        });

        return result;
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}秒`;
  return `${mins}分${secs}秒`;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

export const getScoreLevel = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= 90) return { label: '优秀', color: 'text-green-700', bgColor: 'bg-green-100' };
  if (score >= 80) return { label: '良好', color: 'text-blue-700', bgColor: 'bg-blue-100' };
  if (score >= 60) return { label: '及格', color: 'text-amber-700', bgColor: 'bg-amber-100' };
  return { label: '需加强', color: 'text-red-700', bgColor: 'bg-red-100' };
};

export const getMostFrequentWrongIssues = (
  stats: Record<IssueType, number>,
  limit: number = 3
): { type: IssueType; label: string; count: number }[] => {
  return Object.entries(stats)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([type, count]) => ({
      type: type as IssueType,
      label: ISSUE_TYPE_LABELS[type as IssueType],
      count,
    }));
};

export const getMostFrequentOperationErrors = (
  stats: Record<OperationErrorType, number>,
  limit: number = 3
): { type: OperationErrorType; label: string; count: number }[] => {
  return Object.entries(stats)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([type, count]) => ({
      type: type as OperationErrorType,
      label: OPERATION_ERROR_LABELS[type as OperationErrorType],
      count,
    }));
};

export { initialWrongStats, initialOperationErrorStats };
