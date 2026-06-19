import { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Patient,
  Receipt,
  IssueType,
  PAYMENT_METHOD_LABELS,
  RECEIPT_TYPE_LABELS,
} from '@/types';
import { usePracticeStore } from '@/store/usePracticeStore';
import { receipts } from '@/data/receipts';
import { formatCurrency } from '@/utils/format';
import DropZone, { DragDropData } from '@/components/issue/DropZone';
import IssueTag from '@/components/issue/IssueTag';
import {
  User,
  Stethoscope,
  UserRound,
  CreditCard,
  FileText,
  AlertCircle,
  Receipt as ReceiptIcon,
  X,
  Wallet,
  Banknote,
  MessageCircle,
  Percent,
  RotateCcw,
} from 'lucide-react';

interface PatientReconcileCardProps {
  patient: Patient;
}

const paymentMethodColors: Record<string, string> = {
  wechat: 'border-green-200 bg-green-50 text-green-700',
  alipay: 'border-blue-200 bg-blue-50 text-blue-700',
  cash: 'border-orange-200 bg-orange-50 text-orange-700',
  card: 'border-purple-200 bg-purple-50 text-purple-700',
  member: 'border-teal-200 bg-teal-50 text-teal-700',
  installment: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

const receiptIconMap: Record<string, React.ReactNode> = {
  wechat: <MessageCircle className="w-3.5 h-3.5" />,
  alipay: <CreditCard className="w-3.5 h-3.5" />,
  cash: <Banknote className="w-3.5 h-3.5" />,
  card: <CreditCard className="w-3.5 h-3.5" />,
  discount: <Percent className="w-3.5 h-3.5" />,
  refund: <RotateCcw className="w-3.5 h-3.5" />,
  member_recharge: <Wallet className="w-3.5 h-3.5" />,
  member_consume: <Wallet className="w-3.5 h-3.5" />,
};

const receiptBadgeColors: Record<string, string> = {
  wechat: 'bg-green-100 text-green-700',
  alipay: 'bg-blue-100 text-blue-700',
  cash: 'bg-orange-100 text-orange-700',
  card: 'bg-purple-100 text-purple-700',
  discount: 'bg-gray-100 text-gray-700',
  refund: 'bg-red-100 text-red-700',
  member_recharge: 'bg-teal-100 text-teal-700',
  member_consume: 'bg-cyan-100 text-cyan-700',
};

function MiniReceiptCard({
  receipt,
  onRemove,
}: {
  receipt: Receipt;
  onRemove: () => void;
}) {
  const badgeColor =
    receiptBadgeColors[receipt.type] || 'bg-gray-100 text-gray-700';
  const icon = receiptIconMap[receipt.type] || <CreditCard className="w-3.5 h-3.5" />;
  const isRefund = receipt.type === 'refund';
  const isDiscount = receipt.type === 'discount';
  const isZeroAmount = receipt.amount === 0;

  return (
    <div
      className={cn(
        'relative flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white border border-gray-200 shadow-sm',
        'hover:shadow-md hover:border-gray-300 transition-all duration-200'
      )}
    >
      <div className={cn('p-1.5 rounded-md shrink-0', badgeColor)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">
          {RECEIPT_TYPE_LABELS[receipt.type]}
        </div>
        <div
          className={cn(
            'text-xs font-semibold',
            isZeroAmount ? 'text-gray-400' : isRefund ? 'text-red-600' : 'text-gray-700'
          )}
        >
          {isRefund && !isZeroAmount ? '-' : ''}
          {isDiscount && !isZeroAmount ? '-' : ''}
          {formatCurrency(receipt.amount)}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        title="移除凭证"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function PatientReconcileCard({ patient }: PatientReconcileCardProps) {
  const matchedReceiptIds = usePracticeStore(
    (state) => state.matchedReceipts[patient.id] || []
  );
  const patientIssues = usePracticeStore(
    (state) => state.patientIssues[patient.id] || []
  );
  const matchReceipt = usePracticeStore((state) => state.matchReceipt);
  const unmatchReceipt = usePracticeStore((state) => state.unmatchReceipt);
  const addIssue = usePracticeStore((state) => state.addIssue);
  const removeIssue = usePracticeStore((state) => state.removeIssue);

  const matchedReceipts = useMemo(
    () =>
      matchedReceiptIds
        .map((id) => receipts.find((r) => r.id === id))
        .filter((r): r is Receipt => r !== undefined),
    [matchedReceiptIds]
  );

  const matchedTotal = useMemo(
    () =>
      matchedReceipts.reduce((sum, r) => {
        if (r.type === 'refund' || r.type === 'discount') {
          return sum - r.amount;
        }
        return sum + r.amount;
      }, 0),
    [matchedReceipts]
  );

  const paymentStyle =
    paymentMethodColors[patient.paymentMethod] ||
    'border-gray-200 bg-gray-50 text-gray-700';

  const handleDrop = useCallback(
    (data: DragDropData) => {
      if (data.type === 'receipt' && data.id) {
        matchReceipt(patient.id, data.id);
      } else if (data.type === 'issue' && data.issueType) {
        addIssue(patient.id, data.issueType as IssueType);
      }
    },
    [patient.id, matchReceipt, addIssue]
  );

  const handleRemoveReceipt = useCallback(
    (receiptId: string) => {
      unmatchReceipt(patient.id, receiptId);
    },
    [patient.id, unmatchReceipt]
  );

  const handleRemoveIssue = useCallback(
    (issue: IssueType) => {
      removeIssue(patient.id, issue);
    },
    [patient.id, removeIssue]
  );

  return (
    <DropZone onDrop={handleDrop} className="border border-gray-200">
      <div className="bg-white rounded-xl overflow-hidden">
        <div
          className={cn(
            'px-4 py-3 border-b',
            patient.gender === '男'
              ? 'bg-gradient-to-r from-blue-50 to-white border-blue-100'
              : 'bg-gradient-to-r from-pink-50 to-white border-pink-100'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  patient.gender === '男'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-pink-100 text-pink-700'
                )}
              >
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{patient.name}</div>
                <div className="text-xs text-gray-500">
                  {patient.gender} · {patient.age}岁
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500 mb-0.5">应收金额</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(patient.receivableAmount)}
              </div>
              {matchedReceipts.length > 0 && (
                <div className="text-xs text-gray-500 mt-0.5">
                  已匹配:{' '}
                  <span
                    className={cn(
                      'font-medium',
                      matchedTotal === patient.receivableAmount
                        ? 'text-green-600'
                        : matchedTotal > patient.receivableAmount
                        ? 'text-orange-600'
                        : 'text-blue-600'
                    )}
                  >
                    {formatCurrency(matchedTotal)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Stethoscope className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">治疗项目</div>
                <div className="text-sm text-gray-900 font-medium truncate">
                  {patient.treatmentItem}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <UserRound className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">主治医生</div>
                <div className="text-sm text-gray-900 font-medium truncate">
                  {patient.doctor}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-gray-500 mb-0.5">支付方式</div>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                    paymentStyle
                  )}
                >
                  {PAYMENT_METHOD_LABELS[patient.paymentMethod]}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-gray-500 mb-0.5">关联凭证</div>
                <span className="text-sm text-gray-900 font-medium">
                  {patient.expectedReceiptIds.length} 张
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2.5">
              <ReceiptIcon className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs font-medium text-gray-700">
                已匹配凭证 ({matchedReceipts.length})
              </span>
              <span className="text-xs text-gray-400">· 拖拽凭证到此处</span>
            </div>
            {matchedReceipts.length === 0 ? (
              <div className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50">
                <span className="text-xs text-gray-400">暂无匹配凭证</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {matchedReceipts.map((receipt) => (
                  <MiniReceiptCard
                    key={receipt.id}
                    receipt={receipt}
                    onRemove={() => handleRemoveReceipt(receipt.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-gray-700">
                标记问题 ({patientIssues.length})
              </span>
              <span className="text-xs text-gray-400">· 拖拽问题标签到此处</span>
            </div>
            {patientIssues.length === 0 ? (
              <div className="flex items-center justify-center h-12 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50">
                <span className="text-xs text-gray-400">暂无标记问题</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {patientIssues.map((issue) => (
                  <IssueTag
                    key={issue}
                    issue={issue}
                    onRemove={() => handleRemoveIssue(issue)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DropZone>
  );
}
