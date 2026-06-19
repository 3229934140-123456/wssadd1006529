import { cn } from '@/lib/utils';
import { Patient, PAYMENT_METHOD_LABELS } from '@/types';
import { formatCurrency } from '@/utils/format';
import { User, Stethoscope, CreditCard } from 'lucide-react';

interface PatientTableRowProps {
  patient: Patient;
  index: number;
  selected?: boolean;
  onClick?: () => void;
}

const paymentMethodColors: Record<string, string> = {
  wechat: 'text-green-600 bg-green-50',
  alipay: 'text-blue-600 bg-blue-50',
  cash: 'text-orange-600 bg-orange-50',
  card: 'text-purple-600 bg-purple-50',
  member: 'text-teal-600 bg-teal-50',
  installment: 'text-indigo-600 bg-indigo-50',
};

export default function PatientTableRow({
  patient,
  index,
  selected,
  onClick,
}: PatientTableRowProps) {
  const paymentColor =
    paymentMethodColors[patient.paymentMethod] ||
    'text-gray-600 bg-gray-50';

  return (
    <tr
      className={cn(
        'cursor-pointer transition-all duration-200 border-b border-gray-100',
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
        'hover:bg-blue-50/80 hover:shadow-sm',
        selected && 'bg-blue-50 ring-1 ring-inset ring-blue-200'
      )}
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium',
              patient.gender === '男'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-pink-100 text-pink-700'
            )}
          >
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {patient.name}
            </div>
            <div className="text-xs text-gray-500">
              {patient.gender} · {patient.age}岁
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Stethoscope className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-gray-700 line-clamp-1">
            {patient.treatmentItem}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{patient.doctor}</span>
      </td>

      <td className="px-4 py-3">
        <span className="font-semibold text-gray-900 text-sm">
          {formatCurrency(patient.receivableAmount)}
        </span>
      </td>

      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            paymentColor
          )}
        >
          <CreditCard className="w-3 h-3" />
          {PAYMENT_METHOD_LABELS[patient.paymentMethod]}
        </span>
      </td>
    </tr>
  );
}
