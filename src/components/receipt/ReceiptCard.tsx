import { cn } from '@/lib/utils';
import { Receipt, ReceiptType, RECEIPT_TYPE_LABELS } from '@/types';
import { formatCurrency, maskCardNumber } from '@/utils/format';
import {
  MessageCircle,
  CreditCard as AlipayIcon,
  Banknote,
  CreditCard,
  Percent,
  RotateCcw,
  Wallet,
  Clock,
  Hash,
  User,
} from 'lucide-react';

interface ReceiptCardProps {
  receipt: Receipt;
  selected?: boolean;
  onClick?: () => void;
}

interface ReceiptStyleConfig {
  gradient: string;
  iconBg: string;
  iconColor: string;
  badge: string;
  border: string;
  accent: string;
}

const receiptStyles: Record<ReceiptType, ReceiptStyleConfig> = {
  wechat: {
    gradient: 'from-green-500 to-green-600',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
    border: 'border-green-200',
    accent: 'text-green-600',
  },
  alipay: {
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    accent: 'text-blue-600',
  },
  cash: {
    gradient: 'from-orange-500 to-orange-600',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200',
    accent: 'text-orange-600',
  },
  card: {
    gradient: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-200',
    accent: 'text-purple-600',
  },
  discount: {
    gradient: 'from-gray-500 to-gray-600',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-700',
    border: 'border-gray-200',
    accent: 'text-gray-600',
  },
  refund: {
    gradient: 'from-red-500 to-red-600',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-200',
    accent: 'text-red-600',
  },
  member_recharge: {
    gradient: 'from-teal-500 to-cyan-600',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    badge: 'bg-teal-100 text-teal-700',
    border: 'border-teal-200',
    accent: 'text-teal-600',
  },
  member_consume: {
    gradient: 'from-cyan-500 to-teal-600',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    badge: 'bg-cyan-100 text-cyan-700',
    border: 'border-cyan-200',
    accent: 'text-cyan-600',
  },
};

const ReceiptIcon = ({ type }: { type: ReceiptType }) => {
  const iconMap: Record<ReceiptType, React.ReactNode> = {
    wechat: <MessageCircle className="w-6 h-6" />,
    alipay: <AlipayIcon className="w-6 h-6" />,
    cash: <Banknote className="w-6 h-6" />,
    card: <CreditCard className="w-6 h-6" />,
    discount: <Percent className="w-6 h-6" />,
    refund: <RotateCcw className="w-6 h-6" />,
    member_recharge: <Wallet className="w-6 h-6" />,
    member_consume: <Wallet className="w-6 h-6" />,
  };
  return iconMap[type] || <CreditCard className="w-6 h-6" />;
};

export default function ReceiptCard({
  receipt,
  selected,
  onClick,
}: ReceiptCardProps) {
  const style = receiptStyles[receipt.type];
  const isRefund = receipt.type === 'refund';
  const isDiscount = receipt.type === 'discount';
  const isZeroAmount = receipt.amount === 0;

  return (
    <div
      className={cn(
        'group relative bg-white rounded-xl overflow-hidden shadow-sm border transition-all duration-300 cursor-pointer',
        'hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]',
        selected
          ? cn('ring-2 ring-offset-2', style.border.replace('border-', 'ring-'))
          : 'border-gray-200',
        receipt.isDecoy && 'opacity-60'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'h-20 bg-gradient-to-br relative overflow-hidden',
          style.gradient
        )}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute top-2 -left-2 w-16 h-16 rounded-full bg-white/10" />
        </div>

        <div className="absolute inset-0 px-4 py-3 flex items-start justify-between">
          <div className={cn('p-2 rounded-lg bg-white/20 backdrop-blur-sm')}>
            <div className="text-white">
              <ReceiptIcon type={receipt.type} />
            </div>
          </div>
          <span
            className={cn(
              'px-2 py-0.5 rounded-md text-xs font-medium backdrop-blur-sm',
              'bg-white/20 text-white'
            )}
          >
            {RECEIPT_TYPE_LABELS[receipt.type]}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-4">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 10">
            <path
              d="M0,0 Q10,10 20,0 T40,0 T60,0 T80,0 T100,0 L100,10 L0,10 Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      <div className="p-4 pt-3">
        <div className="text-right mb-3">
          <div className="text-xs text-gray-500 mb-0.5">
            {isRefund ? '退款金额' : isDiscount ? '减免金额' : '收款金额'}
          </div>
          <div
            className={cn(
              'text-2xl font-bold',
              isZeroAmount ? 'text-gray-400' : style.accent
            )}
          >
            {isRefund && !isZeroAmount ? '-' : ''}
            {formatCurrency(receipt.amount)}
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-dashed border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-500">付款人:</span>
            <span className="text-gray-900 font-medium truncate">
              {receipt.payerName || '未知'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-500">时间:</span>
            <span className="text-gray-700 font-mono text-xs">
              {receipt.timestamp}
            </span>
          </div>

          {receipt.transactionId && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-500">交易号:</span>
              <span className="text-gray-700 font-mono text-xs truncate">
                {receipt.transactionId}
              </span>
            </div>
          )}

          {receipt.cardLast4 && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-500">卡号:</span>
              <span className="text-gray-700 font-mono text-xs">
                {maskCardNumber(receipt.cardLast4)}
              </span>
            </div>
          )}

          {receipt.note && (
            <div className="pt-1 mt-1 border-t border-gray-100">
              <p className="text-xs text-gray-500 line-clamp-2">
                {receipt.note}
              </p>
            </div>
          )}
        </div>
      </div>

      {receipt.isDecoy && (
        <div className="absolute top-24 right-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600">
            干扰凭证
          </span>
        </div>
      )}
    </div>
  );
}
