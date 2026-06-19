import { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePracticeStore } from '@/store/usePracticeStore';
import { getPatientsBySceneId, getReceiptsBySceneId } from '@/utils/validation';
import { scenes } from '@/data/scenes';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui';
import PatientReconcileCard from '@/components/patient/PatientReconcileCard';
import DraggableReceipt from '@/components/receipt/DraggableReceipt';
import IssueDock from '@/components/issue/IssueDock';
import ExamTimer from '@/components/exam/ExamTimer';
import SelfCheckPanel from '@/components/reconcile/SelfCheckPanel';
import { Difficulty } from '@/types';
import { cn } from '@/lib/utils';
import {
  Users,
  CheckCircle2,
  Send,
  Stethoscope,
  Receipt as ReceiptIcon,
} from 'lucide-react';

const getExamDuration = (difficulty: Difficulty): number => {
  const durations: Record<Difficulty, number> = {
    1: 600,
    2: 900,
    3: 1200,
    4: 1500,
    5: 1800,
  };
  return durations[difficulty] || 900;
};

export default function Reconcile() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();
  const matchedReceipts = usePracticeStore((state) => state.matchedReceipts);
  const submitReconciliation = usePracticeStore((state) => state.submitReconciliation);
  const isExamMode = usePracticeStore((state) => state.isExamMode);
  const startTime = usePracticeStore((state) => state.startTime);
  const startTimer = usePracticeStore((state) => state.startTimer);

  const scene = useMemo(() => scenes.find((s) => s.id === sceneId), [sceneId]);
  const patients = useMemo(() => (sceneId ? getPatientsBySceneId(sceneId) : []), [sceneId]);
  const allReceipts = useMemo(() => (sceneId ? getReceiptsBySceneId(sceneId) : []), [sceneId]);

  const matchedReceiptIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(matchedReceipts).forEach((receiptIds) => {
      receiptIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [matchedReceipts]);

  const unmatchedReceipts = useMemo(
    () => allReceipts.filter((r) => !matchedReceiptIds.has(r.id)),
    [allReceipts, matchedReceiptIds]
  );

  const patientsWithMatches = useMemo(() => {
    return patients.filter((p) => {
      const matched = matchedReceipts[p.id] || [];
      return matched.length > 0;
    });
  }, [patients, matchedReceipts]);

  const matchProgress = patients.length > 0 ? (patientsWithMatches.length / patients.length) * 100 : 0;

  const examDuration = useMemo(
    () => (scene ? getExamDuration(scene.difficulty) : 900),
    [scene]
  );

  const handleSubmit = () => {
    if (sceneId) {
      submitReconciliation();
      navigate(`/scenes/${sceneId}/feedback`);
    }
  };

  const handleTimeUp = () => {
    handleSubmit();
  };

  const handleLocatePatient = (patientId: string) => {
    const element = document.getElementById(`patient-card-${patientId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-flash');
      setTimeout(() => {
        element.classList.remove('highlight-flash');
      }, 1500);
    }
  };

  useEffect(() => {
    if (isExamMode && startTime === null && scene) {
      startTimer();
    }
  }, [isExamMode, startTime, scene, startTimer]);

  if (!scene) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <p className="text-gray-500">场景不存在</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-40">
      <div className="mb-6">
        <div
          className={cn(
            'bg-white rounded-2xl shadow-sm border overflow-hidden',
            isExamMode ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-100'
          )}
        >
          <div
            className={cn(
              'px-6 py-5 border-b',
              isExamMode ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'
            )}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                    isExamMode
                      ? 'bg-gradient-to-br from-orange-100 to-rose-100'
                      : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                  )}
                >
                  {scene.icon}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{scene.name}</h1>
                  <div className="flex items-center gap-2 mt-0.5 text-gray-500 text-sm">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{scene.category}</span>
                    {isExamMode && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                        考核模式
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isExamMode && (
                  <ExamTimer
                    totalSeconds={examDuration}
                    isRunning={startTime !== null}
                    onTimeUp={handleTimeUp}
                  />
                )}
                <div
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border',
                    isExamMode
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-blue-50 border-blue-100'
                  )}
                >
                  <Users
                    className={cn(
                      'w-5 h-5',
                      isExamMode ? 'text-orange-500' : 'text-blue-500'
                    )}
                  />
                  <div>
                    <div
                      className={cn(
                        'text-xs',
                        isExamMode ? 'text-orange-600' : 'text-blue-600'
                      )}
                    >
                      对账进度
                    </div>
                    <div
                      className={cn(
                        'font-bold',
                        isExamMode ? 'text-orange-700' : 'text-blue-700'
                      )}
                    >
                      {patientsWithMatches.length} / {patients.length} 位患者
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'px-6 py-4',
              isExamMode ? 'bg-orange-50/50' : 'bg-gray-50/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 ease-out',
                    isExamMode
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  )}
                  style={{ width: `${matchProgress}%` }}
                />
              </div>
              <div className="text-sm font-semibold text-gray-700 min-w-[60px] text-right">
                {Math.round(matchProgress)}%
              </div>
              {matchProgress === 100 && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ReceiptIcon className="w-5 h-5 text-green-500" />
              待匹配凭证
              <span className="text-sm font-normal text-gray-500">
                ({unmatchedReceipts.length} 张剩余)
              </span>
            </h2>
            <span className="text-xs text-gray-400">拖拽凭证到下方患者卡片中进行匹配</span>
          </div>
          <div className="p-4 overflow-x-auto">
            {unmatchedReceipts.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-gray-600 font-medium">所有凭证已匹配完成</p>
                <p className="text-gray-400 text-sm mt-1">请继续标记问题，或直接提交对账</p>
              </div>
            ) : (
              <div className="flex gap-4 pb-2">
                {unmatchedReceipts.map((receipt) => (
                  <div key={receipt.id} className="shrink-0 w-56">
                    <DraggableReceipt
                      receipt={receipt}
                      hideDecoy={isExamMode}
                      hideExamSpoilers={isExamMode}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            患者对账
            <span className="text-sm font-normal text-gray-500">({patients.length} 位患者)</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {patients.map((patient) => (
            <PatientReconcileCard
              key={patient.id}
              patient={patient}
              isExamMode={isExamMode}
            />
          ))}
        </div>
      </div>

      <IssueDock />

      <div className="fixed bottom-24 right-6 z-40 flex items-end gap-3">
        <Button
          size="lg"
          onClick={handleSubmit}
          className={cn(
            'shadow-xl h-12',
            isExamMode
              ? 'shadow-orange-500/30 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600'
              : 'shadow-blue-500/30'
          )}
        >
          <Send className="w-5 h-5" />
          提交对账
        </Button>
        <SelfCheckPanel
          patients={patients}
          unmatchedReceiptCount={unmatchedReceipts.length}
          noFixed
          onLocatePatient={handleLocatePatient}
        />
      </div>
    </PageContainer>
  );
}
