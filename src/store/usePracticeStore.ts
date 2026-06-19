import { create } from 'zustand';
import { IssueType, PracticeState, ReconciliationResult } from '../types';
import { calculateOverallResults } from '../utils/validation';

interface PracticeStore extends PracticeState {
  setCurrentScene: (id: string) => void;
  setStep: (step: PracticeState['step']) => void;
  matchReceipt: (patientId: string, receiptId: string) => void;
  unmatchReceipt: (patientId: string, receiptId: string) => void;
  addIssue: (patientId: string, issue: IssueType) => void;
  removeIssue: (patientId: string, issue: IssueType) => void;
  submitReconciliation: () => void;
  resetPractice: () => void;
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  currentSceneId: null,
  step: 'select',
  matchedReceipts: {},
  patientIssues: {},
  results: null,
  score: null,

  setCurrentScene: (id: string) =>
    set({
      currentSceneId: id,
      step: 'bill',
      matchedReceipts: {},
      patientIssues: {},
      results: null,
      score: null,
    }),

  setStep: (step: PracticeState['step']) => set({ step }),

  matchReceipt: (patientId: string, receiptId: string) =>
    set((state) => {
      const current = state.matchedReceipts[patientId] || [];
      if (current.includes(receiptId)) return state;
      return {
        matchedReceipts: {
          ...state.matchedReceipts,
          [patientId]: [...current, receiptId],
        },
      };
    }),

  unmatchReceipt: (patientId: string, receiptId: string) =>
    set((state) => {
      const current = state.matchedReceipts[patientId] || [];
      return {
        matchedReceipts: {
          ...state.matchedReceipts,
          [patientId]: current.filter((id) => id !== receiptId),
        },
      };
    }),

  addIssue: (patientId: string, issue: IssueType) =>
    set((state) => {
      const current = state.patientIssues[patientId] || [];
      if (current.includes(issue)) return state;
      return {
        patientIssues: {
          ...state.patientIssues,
          [patientId]: [...current, issue],
        },
      };
    }),

  removeIssue: (patientId: string, issue: IssueType) =>
    set((state) => {
      const current = state.patientIssues[patientId] || [];
      return {
        patientIssues: {
          ...state.patientIssues,
          [patientId]: current.filter((i) => i !== issue),
        },
      };
    }),

  submitReconciliation: () => {
    const { currentSceneId, matchedReceipts, patientIssues } = get();
    if (!currentSceneId) return;

    const { results, score } = calculateOverallResults(
      currentSceneId,
      matchedReceipts,
      patientIssues
    );

    set({
      results,
      score,
      step: 'feedback',
    });
  },

  resetPractice: () =>
    set({
      matchedReceipts: {},
      patientIssues: {},
      results: null,
      score: null,
      step: 'bill',
    }),
}));
