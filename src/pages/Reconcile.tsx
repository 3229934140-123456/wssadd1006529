import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePracticeStore } from '@/store/usePracticeStore';
import { getPatientsBySceneId, getReceiptsBySceneId } from '@/utils/validation';
import { scenes } from '@/data/scenes';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui';
import PatientReconcileCard from '@/components/patient/PatientReconcileCard';
import DraggableReceipt from '@/components/receipt/DraggableReceipt';
import IssueDock from '@/components/issue/IssueDock';
import {
  Users,
  CheckCircle2,
  Send,
  Stethoscope,
  Receipt as ReceiptIcon,
} from 'lucide-react';

export default function Reconcile() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();
  const matchedReceipts = usePracticeStore((state) => state.matchedReceipts);
  const submitReconciliation = usePracticeStore((state) => state.submitReconciliation);

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

  const handleSubmit = () => {
    if (sceneId) {
      submitReconciliation();
      navigate(`/scenes/${sceneId}/feedback`);
    }
  };

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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl">
                  {scene.icon}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{scene.name}</h1>
                  <div className="flex items-center gap-2 mt-0.5 text-gray-500 text-sm">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{scene.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-xs text-blue-600">对账进度</div>
                    <div className="font-bold text-blue-700">
                      {patientsWithMatches.length} / {patients.length} 位患者
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
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
                    <DraggableReceipt receipt={receipt} />
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
            <PatientReconcileCard key={patient.id} patient={patient} />
          ))}
        </div>
      </div>

      <IssueDock />

      <div className="fixed bottom-24 right-6 z-40">
        <Button size="lg" onClick={handleSubmit} className="shadow-xl shadow-blue-500/30">
          <Send className="w-5 h-5" />
          提交对账
        </Button>
      </div>
    </PageContainer>
  );
}
