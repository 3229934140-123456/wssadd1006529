import { Patient, Receipt, ReconciliationResult, IssueType } from '../types';
import { patients } from '../data/patients';
import { receipts } from '../data/receipts';
import { calculateScore } from './format';

export const getPatientsBySceneId = (sceneId: string): Patient[] => {
  return patients.filter((p) => p.sceneId === sceneId);
};

export const getReceiptsBySceneId = (sceneId: string): Receipt[] => {
  return receipts.filter((r) => r.sceneId === sceneId);
};

export const getPatientById = (patientId: string): Patient | undefined => {
  return patients.find((p) => p.id === patientId);
};

export const getReceiptById = (receiptId: string): Receipt | undefined => {
  return receipts.find((r) => r.id === receiptId);
};

const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
};

export const validatePatientReconciliation = (
  patient: Patient,
  matchedReceiptIds: string[],
  selectedIssues: IssueType[]
): Omit<ReconciliationResult, 'patientId'> => {
  const isMatchCorrect = arraysEqual(
    matchedReceiptIds.sort(),
    patient.expectedReceiptIds.sort()
  );

  const isIssueCorrect = arraysEqual(
    [...selectedIssues].sort(),
    [...patient.issues].sort()
  );

  return {
    matchedReceiptIds,
    selectedIssues,
    isMatchCorrect,
    isIssueCorrect,
    totalCorrect: isMatchCorrect && isIssueCorrect,
  };
};

export const calculateOverallResults = (
  sceneId: string,
  matchedReceipts: Record<string, string[]>,
  patientIssues: Record<string, IssueType[]>
): { results: ReconciliationResult[]; score: number } => {
  const scenePatients = getPatientsBySceneId(sceneId);

  const results = scenePatients.map((patient) => {
    const matched = matchedReceipts[patient.id] || [];
    const issues = patientIssues[patient.id] || [];
    const validation = validatePatientReconciliation(patient, matched, issues);

    return {
      patientId: patient.id,
      ...validation,
    };
  });

  const correctCount = results.filter((r) => r.totalCorrect).length;
  const score = calculateScore(correctCount, results.length);

  return { results, score };
};

export const getTotalReceivableAmount = (sceneId: string): number => {
  const scenePatients = getPatientsBySceneId(sceneId);
  return scenePatients.reduce((sum, p) => sum + p.receivableAmount, 0);
};

export const getTotalReceiptAmount = (sceneId: string): number => {
  const sceneReceipts = getReceiptsBySceneId(sceneId).filter((r) => !r.isDecoy);
  return sceneReceipts.reduce((sum, r) => sum + r.amount, 0);
};
