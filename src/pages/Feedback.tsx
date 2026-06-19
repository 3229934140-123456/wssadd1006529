import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePracticeStore } from '@/store/usePracticeStore';
import { getPatientsBySceneId, getReceiptById } from '@/utils/validation';
import { formatCurrency } from '@/utils/format';
import { scenes } from '@/data/scenes';
import { patients as allPatients } from '@/data/patients';
import { ISSUE_TYPE_LABELS, RECEIPT_TYPE_LABELS, IssueType, Scene, Patient, TrainingPlan, OPERATION_ERROR_LABELS } from '@/types';
import { useRecordsStore } from '@/store/useRecordsStore';
import { PageContainer } from '@/components/layout';
import { Button, ProgressRing, Accordion, Modal, AccordionItem, Badge, Card } from '@/components/ui';
import IssueTag from '@/components/issue/IssueTag';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  BookOpen,
  Lightbulb,
  Target,
  Award,
  FileText,
  MessageCircle,
  Stethoscope,
  Clock,
  TrendingUp,
  Sparkles,
  Play,
  Copy,
  Check,
  Layers,
  AlertTriangle,
  XSquare,
  Calculator,
} from 'lucide-react';

const EXAM_PASS_SCORE = 80;

const ISSUE_TYPE_SUGGESTIONS: Record<IssueType, string> = {
  not_received: '建议先核对POS机交易流水和微信支付宝商户后台，确认款项是否真的未到账',
  duplicate_payment: '建议先核对POS机交易流水号，确认是否真的重复扣款，再联系患者退款',
  missing_invoice: '建议核对开票系统，确认是否漏开，及时补开并通知患者',
  refund_not_recorded: '建议核对退款审批单和银行流水，确认退款是否已执行并登记',
  amount_mismatch: '建议重新核算患者费用明细，确认是否有遗漏项目或计算错误',
  discount_not_approved: '建议核对减免单是否有医生签字和店长审批，按规定流程走',
  wrong_payment_method: '建议核对患者实际支付方式，确保与系统记录一致，避免后续对账混乱',
};

interface WrongPatientDetail {
  patient: Patient;
  result: {
    patientId: string;
    isMatchCorrect: boolean;
    isIssueCorrect: boolean;
    totalCorrect: boolean;
  };
  userMatchedIds: string[];
  userIssues: IssueType[];
}

interface WrongIssueGroup {
  type: IssueType;
  label: string;
  count: number;
  patients: WrongPatientDetail[];
  suggestion: string;
}

type OperationErrorType = 'match_error' | 'wrong_issue' | 'missing_issue' | 'amount_judgment';

interface OperationErrorGroup {
  type: OperationErrorType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  count: number;
  patients: WrongPatientDetail[];
  suggestion: string;
  nextStep: string;
}

const OPERATION_ERROR_CONFIG: Record<OperationErrorType, Omit<OperationErrorGroup, 'count' | 'patients'>> = {
  match_error: {
    type: 'match_error',
    label: '匹配错误',
    icon: <XCircle className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: '凭证匹配不正确，包括漏匹配或错匹配',
    suggestion: '仔细核对患者姓名、治疗项目和金额，逐笔匹配，注意干扰凭证',
    nextStep: '先练习凭证匹配基础关，重点关注付款人姓名和交易时间',
  },
  wrong_issue: {
    type: 'wrong_issue',
    label: '误标问题',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: '正常收款的患者被错误标记了问题',
    suggestion: '不要为了凑数而硬找问题，有些患者就是正常收款的',
    nextStep: '复习正常收款的判定标准，先从简单场景练起',
  },
  missing_issue: {
    type: 'missing_issue',
    label: '漏标问题',
    icon: <Target className="w-5 h-5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: '有问题的患者没有被识别出来或漏标了问题类型',
    suggestion: '重点关注金额不符、缺少凭证、退款异常等明显信号',
    nextStep: '强化问题识别训练，每种问题类型各练3题找感觉',
  },
  amount_judgment: {
    type: 'amount_judgment',
    label: '金额判断',
    icon: <Calculator className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: '对金额计算或判断有误，如重复收款、金额不符等',
    suggestion: '每次都算一遍应收和实收是否一致，注意减免、退款等特殊情况',
    nextStep: '专门练金额计算相关的题，先学门诊收费构成',
  },
};

export default function Feedback() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();
  const results = usePracticeStore((state) => state.results);
  const score = usePracticeStore((state) => state.score);
  const matchedReceipts = usePracticeStore((state) => state.matchedReceipts);
  const patientIssues = usePracticeStore((state) => state.patientIssues);
  const resetPractice = usePracticeStore((state) => state.resetPractice);
  const isExamMode = usePracticeStore((state) => state.isExamMode);
  const startTime = usePracticeStore((state) => state.startTime);
  const endTime = usePracticeStore((state) => state.endTime);

  const currentRecordId = useMemo(() => {
    if (!sceneId || !endTime) return null;
    return `${sceneId}-${endTime}`;
  }, [sceneId, endTime]);

  const updateTrainingPlan = useRecordsStore((state) => state.updateTrainingPlan);

  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [isTeacherMode, setIsTeacherMode] = useState(true);

  const scene = useMemo(() => scenes.find((s) => s.id === sceneId), [sceneId]);
  const patients = useMemo(() => (sceneId ? getPatientsBySceneId(sceneId) : []), [sceneId]);

  const stats = useMemo(() => {
    if (!results) return { correct: 0, matchCorrect: 0, issueCorrect: 0, total: 0 };
    return {
      correct: results.filter((r) => r.totalCorrect).length,
      matchCorrect: results.filter((r) => r.isMatchCorrect).length,
      issueCorrect: results.filter((r) => r.isIssueCorrect).length,
      total: results.length,
    };
  }, [results]);

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  const duration = useMemo(() => {
    if (!startTime || !endTime) return { minutes: 0, seconds: 0, totalSeconds: 0 };
    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { minutes, seconds, totalSeconds };
  }, [startTime, endTime]);

  const isPassed = score !== null && score >= EXAM_PASS_SCORE;

  const wrongIssueStats = useMemo(() => {
    if (!results || !patients.length) return [];
    const issueCount = new Map<IssueType, number>();
    const wrongResults = results.filter((r) => !r.totalCorrect);
    wrongResults.forEach((result) => {
      const patient = patients.find((p) => p.id === result.patientId);
      if (patient) {
        patient.issues.forEach((issue) => {
          issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
        });
      }
    });
    const sortedIssues = Array.from(issueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        count,
        label: ISSUE_TYPE_LABELS[type],
        percentage: wrongResults.length > 0 ? Math.round((count / wrongResults.length) * 100) : 0,
      }));
    return sortedIssues;
  }, [results, patients]);

  const recommendedScenes = useMemo((): Scene[] => {
    if (!scene || wrongIssueStats.length === 0) return [];
    const topIssueType = wrongIssueStats[0].type;
    const otherScenes = scenes.filter((s) => s.id !== sceneId);
    const sceneIssueCount = otherScenes.map((s) => {
      const scenePatients = allPatients.filter((p) => p.sceneId === s.id);
      const issueCount = scenePatients.reduce((count, patient) => {
        return count + (patient.issues.includes(topIssueType) ? 1 : 0);
      }, 0);
      return { scene: s, issueCount, difficultyDiff: Math.abs(s.difficulty - scene.difficulty) };
    });
    const sortedScenes = sceneIssueCount
      .filter((s) => s.issueCount > 0)
      .sort((a, b) => {
        if (b.issueCount !== a.issueCount) return b.issueCount - a.issueCount;
        return a.difficultyDiff - b.difficultyDiff;
      })
      .slice(0, 3)
      .map((s) => s.scene);
    if (sortedScenes.length < 2) {
      const similarCategory = otherScenes.filter(
        (s) => s.category === scene.category && s.id !== sceneId && !sortedScenes.includes(s)
      );
      const similarDifficulty = similarCategory.length > 0
        ? similarCategory
        : otherScenes.filter((s) => Math.abs(s.difficulty - scene.difficulty) <= 1 && !sortedScenes.includes(s));
      const additional = similarDifficulty.slice(0, 2 - sortedScenes.length);
      return [...sortedScenes, ...additional];
    }
    return sortedScenes;
  }, [scene, wrongIssueStats, sceneId]);

  const allKnowledgePoints = useMemo(() => {
    const points = new Map<string, string>();
    patients.forEach((p) => {
      points.set(p.feedback.knowledgePoint, p.treatmentItem);
    });
    return Array.from(points.entries());
  }, [patients]);

  const wrongIssueGroups = useMemo((): WrongIssueGroup[] => {
    if (!results || !patients.length) return [];
    const wrongResults = results.filter((r) => !r.totalCorrect);
    const issueGroups = new Map<IssueType, WrongPatientDetail[]>();

    wrongResults.forEach((result) => {
      const patient = patients.find((p) => p.id === result.patientId);
      if (!patient) return;

      const userMatchedIds = matchedReceipts[patient.id] || [];
      const userIssues = patientIssues[patient.id] || [];

      const detail: WrongPatientDetail = {
        patient,
        result: {
          patientId: result.patientId,
          isMatchCorrect: result.isMatchCorrect,
          isIssueCorrect: result.isIssueCorrect,
          totalCorrect: result.totalCorrect,
        },
        userMatchedIds,
        userIssues,
      };

      patient.issues.forEach((issue) => {
        if (!issueGroups.has(issue)) {
          issueGroups.set(issue, []);
        }
        const existing = issueGroups.get(issue)!;
        if (!existing.find((d) => d.patient.id === patient.id)) {
          existing.push(detail);
        }
      });
    });

    const sortedGroups = Array.from(issueGroups.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([type, patients]) => ({
        type,
        label: ISSUE_TYPE_LABELS[type],
        count: patients.length,
        patients,
        suggestion: ISSUE_TYPE_SUGGESTIONS[type],
      }));

    return sortedGroups;
  }, [results, patients, matchedReceipts, patientIssues]);

  const operationErrorGroups = useMemo((): OperationErrorGroup[] => {
    if (!results || !patients.length) return [];
    const allDetails: WrongPatientDetail[] = results
      .filter((r) => !r.totalCorrect)
      .map((result) => {
        const patient = patients.find((p) => p.id === result.patientId)!;
        return {
          patient,
          result: {
            patientId: result.patientId,
            isMatchCorrect: result.isMatchCorrect,
            isIssueCorrect: result.isIssueCorrect,
            totalCorrect: result.totalCorrect,
          },
          userMatchedIds: matchedReceipts[patient.id] || [],
          userIssues: patientIssues[patient.id] || [],
        };
      })
      .filter((d) => d.patient);

    const groups = new Map<OperationErrorType, WrongPatientDetail[]>();

    allDetails.forEach((detail) => {
      const { patient, userMatchedIds, userIssues, result } = detail;
      const expectedIssues = patient.issues;
      const userIssueSet = new Set(userIssues);
      const expectedIssueSet = new Set(expectedIssues);

      if (!result.isMatchCorrect) {
        if (!groups.has('match_error')) {
          groups.set('match_error', []);
        }
        groups.get('match_error')!.push(detail);
      }

      const hasWrongIssue = userIssues.some((i) => !expectedIssueSet.has(i));
      const hasAmountIssue = expectedIssues.some((i) =>
        ['duplicate_payment', 'amount_mismatch', 'discount_not_approved', 'refund_not_recorded'].includes(i)
      );
      const hasMissingIssue = expectedIssues.some((i) => !userIssueSet.has(i));

      if (hasWrongIssue && expectedIssues.length === 0) {
        if (!groups.has('wrong_issue')) {
          groups.set('wrong_issue', []);
        }
        if (!groups.get('wrong_issue')!.find((d) => d.patient.id === patient.id)) {
          groups.get('wrong_issue')!.push(detail);
        }
      }

      if (hasMissingIssue && expectedIssues.length > 0) {
        if (!groups.has('missing_issue')) {
          groups.set('missing_issue', []);
        }
        if (!groups.get('missing_issue')!.find((d) => d.patient.id === patient.id)) {
          groups.get('missing_issue')!.push(detail);
        }
      }

      if (hasAmountIssue && !result.isIssueCorrect) {
        if (!groups.has('amount_judgment')) {
          groups.set('amount_judgment', []);
        }
        if (!groups.get('amount_judgment')!.find((d) => d.patient.id === patient.id)) {
          groups.get('amount_judgment')!.push(detail);
        }
      }
    });

    const sortedGroups: OperationErrorGroup[] = (['match_error', 'missing_issue', 'wrong_issue', 'amount_judgment'] as OperationErrorType[])
      .map((type) => {
        const patients = groups.get(type) || [];
        return {
          ...OPERATION_ERROR_CONFIG[type],
          count: patients.length,
          patients,
        };
      })
      .filter((g) => g.count > 0);

    return sortedGroups;
  }, [results, patients, matchedReceipts, patientIssues]);

  const [copiedVersion, setCopiedVersion] = useState<'brief' | 'detailed' | null>(null);

  const generateTeacherReview = (version: 'brief' | 'detailed' = 'detailed'): string => {
    if (!scene || score === null || !results) return '';

    const wrongCount = stats.total - stats.correct;
    const topOperationError = operationErrorGroups[0];
    const topIssueError = wrongIssueGroups[0];
    const wrongPatients = results
      .filter((r) => !r.totalCorrect)
      .map((r) => patients.find((p) => p.id === r.patientId)?.name || '')
      .filter(Boolean)
      .join('、');

    if (version === 'brief') {
      const lines: string[] = [];
      lines.push(`【${scene.name}】`);
      lines.push(`得分：${score}分（${isPassed ? '✅ 通过' : '❌ 未通过'}）`);
      if (operationErrorGroups.length > 0) {
        lines.push(`主要错误：${operationErrorGroups.slice(0, 2).map((g) => g.label).join('、')}`);
      }
      if (recommendedScenes.length > 0) {
        lines.push(`推荐练习：${recommendedScenes.slice(0, 2).map((s) => s.name).join('、')}`);
      }
      return lines.join('\n');
    }

    const lines: string[] = [];

    lines.push(`【日清对账考核讲评 - ${scene.name}】`);
    lines.push('');
    lines.push(`📊 成绩概况`);
    lines.push(`得分：${score} 分（${isPassed ? '✅ 通过' : '❌ 未通过'}）`);
    lines.push(`正确率：${accuracy}%（${stats.correct}/${stats.total} 位患者）`);
    lines.push(`用时：${duration.minutes}分${duration.seconds.toString().padStart(2, '0')}秒`);
    lines.push(`错误患者：${wrongCount} 人`);
    lines.push('');

    if (operationErrorGroups.length > 0) {
      lines.push(`🎯 主要错误类型`);
      operationErrorGroups.slice(0, 3).forEach((group, idx) => {
        lines.push(`${idx + 1}. ${group.label}（${group.count}人）- ${group.description}`);
      });
      lines.push('');
    }

    if (wrongIssueGroups.length > 0) {
      lines.push(`⚠️ 最常出错的问题`);
      wrongIssueGroups.slice(0, 3).forEach((group, idx) => {
        lines.push(`${idx + 1}. ${group.label}（${group.count}次）`);
      });
      lines.push('');
    }

    if (wrongPatients) {
      lines.push(`👤 需要重点关注的患者`);
      lines.push(wrongPatients);
      lines.push('');
    }

    lines.push(`💡 下一步建议`);
    if (topOperationError) {
      lines.push(`1. 优先加强【${topOperationError.label}】训练`);
      lines.push(`   ${topOperationError.nextStep}`);
    }
    if (topIssueError) {
      lines.push(`2. 重点突破【${topIssueError.label}】问题类型`);
      lines.push(`   ${topIssueError.suggestion}`);
    }
    if (recommendedScenes.length > 0) {
      lines.push(`3. 推荐练习场景：${recommendedScenes.slice(0, 2).map((s) => s.name).join('、')}`);
    }
    lines.push('');
    lines.push('— 带教老师评语');

    return lines.join('\n');
  };

  const handleCopyReview = async (version: 'brief' | 'detailed') => {
    const review = generateTeacherReview(version);
    try {
      await navigator.clipboard.writeText(review);
      setCopiedVersion(version);
      setTimeout(() => setCopiedVersion(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const generateTrainingPlan = (): TrainingPlan | null => {
    if (!currentRecordId || !scene) return null;
    const recScene = recommendedScenes[0];
    const steps: string[] = [];
    operationErrorGroups.slice(0, 3).forEach((group) => {
      steps.push(`${group.label}：${group.nextStep}`);
    });
    if (steps.length === 0) {
      steps.push('本次操作全部正确，继续保持');
    }
    return {
      id: `plan-${currentRecordId}`,
      createdAt: Date.now(),
      recommendedSceneId: recScene?.id || sceneId || '',
      recommendedSceneName: recScene?.name || scene.name,
      operationSteps: steps,
      isCompleted: false,
    };
  };

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewVersion, setReviewVersion] = useState<'brief' | 'detailed'>('detailed');

  const formatReceiptIds = (ids: string[]): string => {
    if (ids.length === 0) return '无';
    return ids
      .map((id) => {
        const receipt = getReceiptById(id);
        return receipt
          ? `${RECEIPT_TYPE_LABELS[receipt.type]} ${formatCurrency(receipt.amount)}`
          : id;
      })
      .join('、');
  };

  const formatIssueTypes = (issues: IssueType[]): string => {
    if (issues.length === 0) return '无';
    return issues.map((i) => ISSUE_TYPE_LABELS[i]).join('、');
  };

  const handleRetry = () => {
    if (sceneId) {
      resetPractice();
      navigate(`/scenes/${sceneId}/bill`);
    }
  };

  const handleBackHome = () => {
    navigate('/');
  };

  const accordionItems: AccordionItem[] = useMemo(() => {
    return patients.map((patient) => {
      const result = results?.find((r) => r.patientId === patient.id);
      const userMatchedIds = matchedReceipts[patient.id] || [];
      const userIssues = patientIssues[patient.id] || [];
      const isCorrect = result?.totalCorrect ?? false;

      return {
        title: (
          <div className="flex items-center gap-3 w-full">
            {isCorrect ? (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{patient.name}</span>
                <span className="text-xs text-gray-500">
                  {patient.gender} · {patient.age}岁
                </span>
              </div>
              <div className="text-xs text-gray-500 truncate mt-0.5">
                {patient.treatmentItem} · {patient.doctor}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-gray-500">应收</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(patient.receivableAmount)}
              </div>
            </div>
          </div>
        ),
        content: (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  实际匹配凭证
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {userMatchedIds.length === 0 ? (
                    <span className="text-xs text-gray-400">未匹配任何凭证</span>
                  ) : (
                    userMatchedIds.map((id) => {
                      const receipt = getReceiptById(id);
                      const label = receipt
                        ? `${RECEIPT_TYPE_LABELS[receipt.type]} ${formatCurrency(receipt.amount)}`
                        : id;
                      return (
                        <span
                          key={id}
                          className={
                            'px-2 py-0.5 rounded text-xs font-medium ' +
                            (patient.expectedReceiptIds.includes(id)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700')
                          }
                        >
                          {label}
                        </span>
                      );
                    })
                  )}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  正确凭证:{' '}
                  {patient.expectedReceiptIds.length === 0
                    ? '无'
                    : patient.expectedReceiptIds
                        .map((id) => {
                          const receipt = getReceiptById(id);
                          return receipt
                            ? `${RECEIPT_TYPE_LABELS[receipt.type]} ${formatCurrency(receipt.amount)}`
                            : id;
                        })
                        .join('、')}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  标记问题
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {userIssues.length === 0 ? (
                    <span className="text-xs text-gray-400">未标记问题</span>
                  ) : (
                    userIssues.map((issue) => (
                      <IssueTag
                        key={issue}
                        issue={issue}
                        selected={patient.issues.includes(issue)}
                      />
                    ))
                  )}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  正确问题:{' '}
                  {patient.issues.length === 0
                    ? '无'
                    : patient.issues.map((i, idx) => (
                        <span key={i}>
                          {idx > 0 ? '、' : ''}
                          {ISSUE_TYPE_LABELS[i]}
                        </span>
                      ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 py-2 border-t border-b border-gray-100">
              <span className="text-sm text-gray-600">对账结果:</span>
              {result?.isMatchCorrect ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> 凭证匹配正确
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                  <XCircle className="w-4 h-4" /> 凭证匹配错误
                </span>
              )}
              <span className="text-gray-300">|</span>
              {result?.isIssueCorrect ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> 问题识别正确
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                  <XCircle className="w-4 h-4" /> 问题识别错误
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-blue-700 mb-1">
                    口腔门诊话术解释
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {patient.feedback.explanation}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-amber-700 mb-1">
                    知识点
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {patient.feedback.knowledgePoint}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-start gap-2">
                <Stethoscope className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    实际场景举例
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {patient.feedback.example}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
      };
    });
  }, [patients, results, matchedReceipts, patientIssues]);

  if (!scene || !results || score === null) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <p className="text-gray-500">暂无对账结果，请先完成对账</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-28">
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`px-6 py-8 ${
            isExamMode
              ? isPassed
                ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50'
                : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'
              : 'bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-6">
                <ProgressRing progress={score} size={140} strokeWidth={10}>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{score}</div>
                    <div className="text-xs text-gray-500">得分</div>
                  </div>
                </ProgressRing>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Award className={`w-6 h-6 ${
                      isExamMode
                        ? isPassed ? 'text-emerald-500' : 'text-orange-500'
                        : 'text-amber-500'
                    }`} />
                    <h1 className="text-2xl font-bold text-gray-900">
                      {scene.name}
                    </h1>
                    {isExamMode && (
                      <Badge variant="danger" className="ml-1">
                        正式考核
                      </Badge>
                    )}
                    {isExamMode && (
                      isPassed ? (
                        <Badge variant="success">
                          <Sparkles className="w-3 h-3 mr-1" />
                          考核通过
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          未通过
                        </Badge>
                      )
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{scene.description}</p>
                  <div className="mt-3 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700">
                        正确率 <span className="font-semibold">{accuracy}%</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700">
                        正确匹配 <span className="font-semibold">{stats.matchCorrect}/{stats.total}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200">
                      <Target className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-gray-700">
                        问题识别 <span className="font-semibold">{stats.issueCorrect}/{stats.total}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-700">
                        用时 <span className="font-semibold">{duration.minutes}分{duration.seconds.toString().padStart(2, '0')}秒</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="text-right">
                  <div className="text-xs text-gray-500">总正确数</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.correct}
                    <span className="text-lg text-gray-400 font-normal"> / {stats.total}</span>
                  </div>
                </div>
                {isExamMode && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">通过标准</div>
                    <div className="text-lg font-semibold text-gray-600">
                      {EXAM_PASS_SCORE} 分以上
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {wrongIssueStats.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              错题分析
            </h2>
            <div className="flex items-center gap-2">
              {isExamMode && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReviewModal(true)}
                  className="gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  带讲评导出
                </Button>
              )}
              <button
                onClick={() => setIsTeacherMode(!isTeacherMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isTeacherMode
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                {isTeacherMode ? '带教模式' : '普通模式'}
              </button>
            </div>
          </div>
          <Card className="p-5">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                本次练习共做错 <span className="font-semibold text-gray-700">{stats.total - stats.correct}</span> 位患者，以下是错误问题类型分布：
              </p>
              <div className="space-y-3">
                {wrongIssueStats.map((item) => (
                  <div key={item.type} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IssueTag issue={item.type} />
                        <span className="text-xs text-gray-500">{item.count} 次</span>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {operationErrorGroups.length > 0 && isTeacherMode && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            操作错误分类
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {operationErrorGroups.map((group) => (
              <div
                key={group.type}
                className={`${group.bgColor} rounded-xl p-4 border border-gray-100`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg bg-white/60 ${group.color}`}>
                    {group.icon}
                  </div>
                  <span className={`font-semibold text-sm ${group.color}`}>{group.label}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {group.count}
                  <span className="text-sm font-normal text-gray-500 ml-1">人</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{group.description}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {operationErrorGroups.map((group) => (
              <div
                key={group.type}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className={`px-5 py-4 border-b border-gray-100 ${group.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg bg-white/80 ${group.color}`}>
                        {group.icon}
                      </div>
                      <span className="font-bold text-gray-900">{group.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/60 text-gray-600 text-xs font-medium">
                        {group.count} 人
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 ml-11">{group.description}</p>
                </div>
                <div className="p-5 space-y-3">
                  {group.patients.slice(0, 3).map((detail) => {
                    const hasMatchError = !detail.result.isMatchCorrect;
                    const hasIssueError = !detail.result.isIssueCorrect;
                    return (
                      <div
                        key={detail.patient.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-gray-700">
                              {detail.patient.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {detail.patient.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {detail.patient.treatmentItem}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {hasMatchError && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                              匹配错
                            </span>
                          )}
                          {hasIssueError && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                              问题错
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {group.patients.length > 3 && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      还有 {group.patients.length - 3} 位患者...
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-amber-700 mb-1">
                          下一步建议
                        </div>
                        <p className="text-xs text-amber-900">
                          {group.nextStep}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {wrongIssueGroups.length > 0 && isTeacherMode && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            错题详情
          </h2>
          <div className="space-y-6">
            {wrongIssueGroups.map((group) => (
              <div key={group.type} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IssueTag issue={group.type} />
                      <span className="font-bold text-gray-900">{group.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        {group.count} 人
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {group.patients.map((detail, idx) => {
                    const hasMatchError = !detail.result.isMatchCorrect;
                    const hasIssueError = !detail.result.isIssueCorrect;
                    const bgClass = hasMatchError
                      ? 'bg-red-50 border-red-100'
                      : hasIssueError
                      ? 'bg-orange-50 border-orange-100'
                      : 'bg-gray-50 border-gray-200';

                    return (
                      <div
                        key={detail.patient.id}
                        className={`rounded-xl border ${bgClass} p-4 ${idx < group.patients.length - 1 ? '' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                              <span className="font-semibold text-gray-700">
                                {detail.patient.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {detail.patient.name} - {detail.patient.treatmentItem}
                              </div>
                              <div className="text-xs text-gray-500">
                                {detail.patient.gender} · {detail.patient.age}岁 · 应收 {formatCurrency(detail.patient.receivableAmount)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasMatchError && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-medium">
                                <XCircle className="w-3 h-3" />
                                匹配错误
                              </span>
                            )}
                            {hasIssueError && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">
                                <XCircle className="w-3 h-3" />
                                问题识别错误
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2.5 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 shrink-0 w-20">正确凭证：</span>
                            <span className="text-gray-900 font-medium">
                              {formatReceiptIds(detail.patient.expectedReceiptIds)}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 shrink-0 w-20">你的选择：</span>
                            <span className={hasMatchError ? 'text-red-700 font-medium' : 'text-green-700 font-medium'}>
                              {formatReceiptIds(detail.userMatchedIds)}
                              {hasMatchError ? (
                                <XCircle className="w-4 h-4 inline ml-1 text-red-500" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 inline ml-1 text-green-500" />
                              )}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 shrink-0 w-20">正确问题：</span>
                            <span className="text-gray-900 font-medium">
                              {formatIssueTypes(detail.patient.issues)}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 shrink-0 w-20">你标问题：</span>
                            <span className={hasIssueError ? 'text-orange-700 font-medium' : 'text-green-700 font-medium'}>
                              {formatIssueTypes(detail.userIssues)}
                              {hasIssueError ? (
                                <XCircle className="w-4 h-4 inline ml-1 text-orange-500" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 inline ml-1 text-green-500" />
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-xs font-semibold text-blue-700 mb-1">
                                下一步建议
                              </div>
                              <p className="text-sm text-blue-900 leading-relaxed">
                                {group.suggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendedScenes.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            推荐练习
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            根据你的错题类型，推荐以下场景进行针对性练习
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedScenes.map((recScene) => (
              <Card
                key={recScene.id}
                hoverable
                onClick={() => {
                  resetPractice();
                  navigate(`/scenes/${recScene.id}/bill`);
                }}
                className="p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${recScene.background} flex items-center justify-center text-2xl shrink-0`}>
                    {recScene.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {recScene.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {recScene.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {recScene.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        难度{'★'.repeat(recScene.difficulty)}{'☆'.repeat(5 - recScene.difficulty)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <button className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                        <Play className="w-3.5 h-3.5" />
                        开始练习
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          逐患者反馈详情
        </h2>
        <Accordion items={accordionItems} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              本次练习得分:{' '}
              <span className="font-bold text-gray-900 text-lg">{score} 分</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleBackHome}>
              <Home className="w-4 h-4" />
              返回场景列表
            </Button>
            <Button variant="secondary" onClick={() => setShowKnowledgeModal(true)}>
              <BookOpen className="w-4 h-4" />
              查看知识点
            </Button>
            <Button onClick={handleRetry}>
              <RotateCcw className="w-4 h-4" />
              重新练习
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showKnowledgeModal}
        onClose={() => setShowKnowledgeModal(false)}
        title="知识点汇总"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {allKnowledgePoints.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无知识点</p>
          ) : (
            allKnowledgePoints.map(([point, treatment], idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-amber-50 border border-amber-100"
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-amber-700 mb-1">
                      {treatment}
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {point}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setShowKnowledgeModal(false)}>
            我知道了
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="带教讲评清单"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReviewVersion('brief')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                reviewVersion === 'brief'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              简短版
            </button>
            <button
              onClick={() => setReviewVersion('detailed')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                reviewVersion === 'detailed'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              详细版
            </button>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {generateTeacherReview(reviewVersion)}
            </pre>
          </div>
          {copiedVersion && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              已复制成功
            </div>
          )}
          <p className="text-xs text-gray-500">
            点击下方按钮可复制讲评内容，粘贴后可根据实际情况调整
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => {
              const plan = generateTrainingPlan();
              if (plan && currentRecordId) {
                updateTrainingPlan(currentRecordId, plan);
              }
            }}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            保存训练计划
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              关闭
            </Button>
            <Button onClick={() => handleCopyReview('brief')} className="gap-2">
              {copiedVersion === 'brief' ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制简短版
                </>
              )}
            </Button>
            <Button onClick={() => handleCopyReview('detailed')} className="gap-2">
              {copiedVersion === 'detailed' ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制详细版
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
