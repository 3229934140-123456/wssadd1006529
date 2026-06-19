import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePracticeStore } from '@/store/usePracticeStore';
import { getPatientsBySceneId, getReceiptsBySceneId, getTotalReceivableAmount } from '@/utils/validation';
import { formatCurrency } from '@/utils/format';
import { scenes } from '@/data/scenes';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui';
import PatientTableRow from '@/components/patient/PatientTableRow';
import ReceiptTabs from '@/components/receipt/ReceiptTabs';
import ReceiptPreviewModal from '@/components/receipt/ReceiptPreviewModal';
import { Receipt } from '@/types';
import {
  Calendar,
  Wallet,
  FileText,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';

export default function BillView() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();
  const setCurrentScene = usePracticeStore((state) => state.setCurrentScene);
  const setStep = usePracticeStore((state) => state.setStep);

  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const scene = useMemo(() => scenes.find((s) => s.id === sceneId), [sceneId]);
  const patients = useMemo(() => (sceneId ? getPatientsBySceneId(sceneId) : []), [sceneId]);
  const receipts = useMemo(() => (sceneId ? getReceiptsBySceneId(sceneId) : []), [sceneId]);
  const totalReceivable = useMemo(() => (sceneId ? getTotalReceivableAmount(sceneId) : 0), [sceneId]);

  const mockDate = '2026-06-20 星期六';

  const handleStartReconcile = () => {
    if (sceneId) {
      setCurrentScene(sceneId);
      setStep('reconcile');
      navigate(`/scenes/${sceneId}/reconcile`);
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
    <PageContainer className="pb-28">
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl">
                  {scene.icon}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{scene.name}</h1>
                  <div className="flex items-center gap-2 mt-1 text-white/80 text-sm">
                    <Stethoscope className="w-4 h-4" />
                    <span>{scene.category}</span>
                    <span>·</span>
                    <span>难度 {'★'.repeat(scene.difficulty)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-white/70" />
                  <div>
                    <div className="text-xs text-white/70">模拟日期</div>
                    <div className="font-medium">{mockDate}</div>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div className="flex items-center gap-2 text-white">
                  <Wallet className="w-5 h-5 text-white/70" />
                  <div>
                    <div className="text-xs text-white/70">应收总额</div>
                    <div className="font-bold text-lg">{formatCurrency(totalReceivable)}</div>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div className="flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-white/70" />
                  <div>
                    <div className="text-xs text-white/70">凭证总数</div>
                    <div className="font-bold text-lg">{receipts.length} 张</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-6">
        <div className="col-span-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-500 rounded-full" />
                患者清单
                <span className="text-sm font-normal text-gray-500">({patients.length} 位患者)</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      患者信息
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      治疗项目
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      医生
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      应收金额
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      支付方式
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, index) => (
                    <PatientTableRow
                      key={patient.id}
                      patient={patient}
                      index={index}
                      selected={selectedPatientId === patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-green-500 rounded-full" />
                收款凭证
                <span className="text-sm font-normal text-gray-500">({receipts.length} 张)</span>
              </h2>
            </div>
            <div className="p-4 max-h-[calc(100vh-340px)] overflow-y-auto">
              <ReceiptTabs
                receipts={receipts}
                onReceiptClick={(receipt) => setPreviewReceipt(receipt)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              共 <span className="font-semibold text-gray-900">{patients.length}</span> 位患者，
              应收总额 <span className="font-semibold text-gray-900">{formatCurrency(totalReceivable)}</span>
            </div>
          </div>
          <Button size="lg" onClick={handleStartReconcile}>
            开始对账
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ReceiptPreviewModal
        receipt={previewReceipt}
        onClose={() => setPreviewReceipt(null)}
      />
    </PageContainer>
  );
}
