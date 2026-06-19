import { cn } from '@/lib/utils';
import { Patient, PAYMENT_METHOD_LABELS } from '@/types';
import { formatCurrency } from '@/utils/format';
import IssueTag from '@/components/issue/IssueTag';
import {
  User,
  Stethoscope,
  UserRound,
  CreditCard,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  selected?: boolean;
  onClick?: () => void;
}

const paymentMethodColors: Record<string, string> = {
  wechat: 'border-green-200 bg-green-50 text-green-700',
  alipay: 'border-blue-200 bg-blue-50 text-blue-700',
  cash: 'border-orange-200 bg-orange-50 text-orange-700',
  card: 'border-purple-200 bg-purple-50 text-purple-700',
  member: 'border-teal-200 bg-teal-50 text-teal-700',
  installment: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

export default function PatientCard({
  patient,
  selected,
  onClick,
}: PatientCardProps) {
  const paymentStyle =
    paymentMethodColors[patient.paymentMethod] ||
    'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-sm transition-all duration-200 cursor-pointer overflow-hidden',
        selected
          ? 'border-blue-400 ring-2 ring-blue-100 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      )}
      onClick={onClick}
    >
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
              <div className="font-semibold text-gray-900">
                {patient.name}
              </div>
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
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Stethoscope className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs text-gray-500 mb-0.5">治疗项目</div>
            <div className="text-sm text-gray-900 font-medium">
              {patient.treatmentItem}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <UserRound className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs text-gray-500 mb-0.5">主治医生</div>
            <div className="text-sm text-gray-900 font-medium">
              {patient.doctor}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs text-gray-500 mb-0.5">支付方式</div>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
                paymentStyle
              )}
            >
              {PAYMENT_METHOD_LABELS[patient.paymentMethod]}
            </span>
          </div>
        </div>

        {patient.issues.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1.5">
                  标记问题 ({patient.issues.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {patient.issues.map((issue) => (
                    <IssueTag key={issue} issue={issue} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500">
            关联凭证: {patient.expectedReceiptIds.length} 张
          </span>
        </div>
      </div>
    </div>
  );
}
