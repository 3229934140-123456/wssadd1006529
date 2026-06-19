import { create } from 'zustand';
import { IssueType, PracticeState, ReconciliationResult, PracticeRecord } from '../types';
import { calculateOverallResults } from '../utils/validation';
import { useRecordsStore } from './useRecordsStore';
import { scenes } from '../data/scenes';
import { getPatientsBySceneId } from '../utils/validation';

const EXAM_PASS_SCORE = 80;

interface PracticeStore extends PracticeState {
  setCurrentScene: (id: string, isExamMode?: boolean) => void;
  setStep: (step: PracticeState['step']) => void;
  matchReceipt: (patientId: string, receiptId: string) => void;
  unmatchReceipt: (patientId: string, receiptId: string) => void;
  addIssue: (patientId: string, issue: IssueType) => void;
  removeIssue: (patientId: string, issue: IssueType) => void;
  startTimer: () => void;
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
  isExamMode: false,
  startTime: null,
  endTime: null,

  setCurrentScene: (id: string, isExamMode = false) =>
    set({
      currentSceneId: id,
      step: 'bill',
      matchedReceipts: {},
      patientIssues: {},
      results: null,
      score: null,
      isExamMode,
      startTime: null,
      endTime: null,
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

  startTimer: () =>
    set({
      startTime: Date.now(),
    }),

  submitReconciliation: () => {
    const { currentSceneId, matchedReceipts, patientIssues, startTime, isExamMode } = get();
    if (!currentSceneId) return;

    const { results, score } = calculateOverallResults(
      currentSceneId,
      matchedReceipts,
      patientIssues
    );

    const endTime = Date.now();
    const duration = startTime ? Math.floor((endTime - startTime) / 1000) : 0;

    set({
      results,
      score,
      endTime,
      step: 'feedback',
    });

    const scene = scenes.find((s) => s.id === currentSceneId);
    if (scene) {
      const wrongIssueTypes: IssueType[] = [];
      const patients = getPatientsBySceneId(currentSceneId);
      const wrongPatientIds = results.filter((r) => !r.totalCorrect).map((r) => r.patientId);
      
      wrongPatientIds.forEach((pid) => {
        const patient = patients.find((p) => p.id === pid);
        if (patient) {
          patient.issues.forEach((issue) => {
            if (!wrongIssueTypes.includes(issue)) {
              wrongIssueTypes.push(issue);
            }
          });
        }
      });

      const record: PracticeRecord = {
        id: `${currentSceneId}-${Date.now()}`,
        sceneId: currentSceneId,
        sceneName: scene.name,
        sceneIcon: scene.icon,
        score,
        isPassed: score >= EXAM_PASS_SCORE,
        isExamMode,
        duration,
        completedAt: endTime,
        wrongIssueTypes,
        wrongPatientCount: wrongPatientIds.length,
        totalPatientCount: results.length,
      };

      useRecordsStore.getState().addRecord(record);
    }
  },

  resetPractice: () =>
    set({
      matchedReceipts: {},
      patientIssues: {},
      results: null,
      score: null,
      startTime: null,
      endTime: null,
      step: 'bill',
    }),
}));
