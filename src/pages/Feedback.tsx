import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePracticeStore } from '@/store/usePracticeStore';
import { getPatientsBySceneId } from '@/utils/validation';
import { formatCurrency } from '@/utils/format';
import { scenes } from '@/data/scenes';
import { PageContainer } from '@/components/layout';
import { Button, ProgressRing, Accordion, Modal, AccordionItem } from '@/components/ui';
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
} from 'lucide-react';

export default function Feedback() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();
  const results = usePracticeStore((state) => state.results);
  const score = usePracticeStore((state) => state.score);
  const matchedReceipts = usePracticeStore((state) => state.matchedReceipts);
  const patientIssues = usePracticeStore((state) => state.patientIssues);
  const resetPractice = usePracticeStore((state) => state.resetPractice);

  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

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

  const allKnowledgePoints = useMemo(() => {
    const points = new Map<string, string>();
    patients.forEach((p) => {
      points.set(p.feedback.knowledgePoint, p.treatmentItem);
    });
    return Array.from(points.entries());
  }, [patients]);

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
                    userMatchedIds.map((id) => (
                      <span
                        key={id}
                        className={
                          'px-2 py-0.5 rounded text-xs font-medium ' +
                          (patient.expectedReceiptIds.includes(id)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700')
                        }
                      >
                        {id}
                      </span>
                    ))
                  )}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  正确凭证: {patient.expectedReceiptIds.join(', ')}
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
                  {patient.issues.length === 0 ? (
                    '无'
                  ) : (
                    patient.issues.map((i, idx) => (
                      <span key={i}>
                        {idx > 0 ? '、' : ''}
                        {i}
                      </span>
                    ))
                  )}
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
          <div className="px-6 py-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-6">
                <ProgressRing progress={score} size={140} strokeWidth={10}>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{score}</div>
                    <div className="text-xs text-gray-500">得分</div>
                  </div>
                </ProgressRing>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-6 h-6 text-amber-500" />
                    <h1 className="text-2xl font-bold text-gray-900">
                      {scene.name}
                    </h1>
                  </div>
                  <p className="text-gray-600 text-sm">{scene.description}</p>
                  <div className="mt-3 flex items-center gap-4">
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
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </PageContainer>
  );
}
