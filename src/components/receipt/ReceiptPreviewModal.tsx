import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Receipt, ReceiptType, RECEIPT_TYPE_LABELS } from '@/types';
import { maskCardNumber } from '@/utils/format';
import {
  MessageCircle,
  CreditCard as AlipayIcon,
  Banknote,
  CreditCard,
  Percent,
  RotateCcw,
  Wallet,
  X,
  CheckCircle2,
  Clock,
  Hash,
  User,
  Receipt as ReceiptIcon,
  Building2,
  Share2,
} from 'lucide-react';

interface ReceiptPreviewModalProps {
  receipt: Receipt | null;
  onClose: () => void;
  hideDecoy?: boolean;
}

interface PreviewStyleConfig {
  bg: string;
  accent: string;
  accentLight: string;
  border: string;
}

const previewStyles: Record<ReceiptType, PreviewStyleConfig> = {
  wechat: {
    bg: 'bg-gradient-to-b from-green-50 to-white',
    accent: 'text-green-600',
    accentLight: 'bg-green-500',
    border: 'border-green-200',
  },
  alipay: {
    bg: 'bg-gradient-to-b from-blue-50 to-white',
    accent: 'text-blue-600',
    accentLight: 'bg-blue-500',
    border: 'border-blue-200',
  },
  cash: {
    bg: 'bg-gradient-to-b from-orange-50 to-white',
    accent: 'text-orange-600',
    accentLight: 'bg-orange-500',
    border: 'border-orange-200',
  },
  card: {
    bg: 'bg-gradient-to-b from-purple-50 to-white',
    accent: 'text-purple-600',
    accentLight: 'bg-purple-500',
    border: 'border-purple-200',
  },
  discount: {
    bg: 'bg-gradient-to-b from-gray-50 to-white',
    accent: 'text-gray-600',
    accentLight: 'bg-gray-500',
    border: 'border-gray-200',
  },
  refund: {
    bg: 'bg-gradient-to-b from-red-50 to-white',
    accent: 'text-red-600',
    accentLight: 'bg-red-500',
    border: 'border-red-200',
  },
  member_recharge: {
    bg: 'bg-gradient-to-b from-teal-50 to-white',
    accent: 'text-teal-600',
    accentLight: 'bg-teal-500',
    border: 'border-teal-200',
  },
  member_consume: {
    bg: 'bg-gradient-to-b from-cyan-50 to-white',
    accent: 'text-cyan-600',
    accentLight: 'bg-cyan-500',
    border: 'border-cyan-200',
  },
};

const TypeIcon = ({ type }: { type: ReceiptType }) => {
  const iconMap: Record<ReceiptType, React.ReactNode> = {
    wechat: <MessageCircle className="w-8 h-8" />,
    alipay: <AlipayIcon className="w-8 h-8" />,
    cash: <Banknote className="w-8 h-8" />,
    card: <CreditCard className="w-8 h-8" />,
    discount: <Percent className="w-8 h-8" />,
    refund: <RotateCcw className="w-8 h-8" />,
    member_recharge: <Wallet className="w-8 h-8" />,
    member_consume: <Wallet className="w-8 h-8" />,
  };
  return iconMap[type] || <CreditCard className="w-8 h-8" />;
};

export default function ReceiptPreviewModal({
  receipt,
  onClose,
  hideDecoy = false,
}: ReceiptPreviewModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (receipt) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [receipt, onClose]);

  if (!receipt) return null;

  const style = previewStyles[receipt.type];
  const isRefund = receipt.type === 'refund';
  const isDiscount = receipt.type === 'discount';
  const isZeroAmount = receipt.amount === 0;
  const showDecoy = receipt.isDecoy && !hideDecoy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={cn(
            'relative pt-8 pb-6 px-6 text-white',
            style.accentLight
          )}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
            <div className="absolute bottom-0 -left-4 w-20 h-20 rounded-full bg-white/30" />
          </div>

          <div className="relative flex flex-col items-center">
            <div className="mb-3 p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <TypeIcon type={receipt.type} />
            </div>

            <div className="text-sm text-white/80 mb-1">
              {RECEIPT_TYPE_LABELS[receipt.type]}
            </div>

            {!isZeroAmount ? (
              <div className="flex items-baseline gap-0.5">
                {isRefund && <span className="text-2xl font-medium">-</span>}
                <span className="text-sm font-medium">¥</span>
                <span className="text-4xl font-bold tracking-tight">
                  {receipt.amount.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-white/70">¥0.00</div>
            )}

            <div className="flex items-center gap-1.5 mt-2 text-sm text-white/90">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isRefund
                  ? '退款成功'
                  : isDiscount
                  ? '减免已生效'
                  : isZeroAmount
                  ? '待处理'
                  : '支付成功'}
              </span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-3">
            <svg
              className="w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 10"
            >
              <path
                d="M0,0 Q5,8 10,0 T20,0 T30,0 T40,0 T50,0 T60,0 T70,0 T80,0 T90,0 T100,0 L100,10 L0,10 Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        <div className={cn('p-6 pt-4', style.bg)}>
          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-dashed border-gray-200">
              <span className="text-gray-500 text-sm flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                付款人
              </span>
              <span className="text-gray-900 font-medium text-sm">
                {receipt.payerName || '未知用户'}
              </span>
            </div>

            <div className="flex justify-between py-2.5 border-b border-dashed border-gray-200">
              <span className="text-gray-500 text-sm flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                交易时间
              </span>
              <span className="text-gray-900 font-mono text-xs">
                {receipt.timestamp}
              </span>
            </div>

            {receipt.transactionId && (
              <div className="flex justify-between py-2.5 border-b border-dashed border-gray-200">
                <span className="text-gray-500 text-sm flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" />
                  交易单号
                </span>
                <span className="text-gray-900 font-mono text-xs">
                  {receipt.transactionId}
                </span>
              </div>
            )}

            {receipt.cardLast4 && (
              <div className="flex justify-between py-2.5 border-b border-dashed border-gray-200">
                <span className="text-gray-500 text-sm flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  支付卡号
                </span>
                <span className="text-gray-900 font-mono text-xs">
                  {maskCardNumber(receipt.cardLast4)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-2.5 border-b border-dashed border-gray-200">
              <span className="text-gray-500 text-sm flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                收款方
              </span>
              <span className="text-gray-900 font-medium text-sm">
                口腔门诊部
              </span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="text-gray-500 text-sm flex items-center gap-2">
                <ReceiptIcon className="w-3.5 h-3.5" />
                商品说明
              </span>
              <span className="text-gray-900 text-sm text-right max-w-[55%] line-clamp-2">
                {receipt.note || '医疗服务费'}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                  <ReceiptIcon className="w-4 h-4" />
                </div>
                <span className="text-xs">电子凭证</span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {showDecoy && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] pointer-events-none">
            <div className="px-6 py-2 border-4 border-red-400/50 rounded-lg">
              <span className="text-2xl font-bold text-red-400/50 tracking-widest">
                干扰凭证
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
