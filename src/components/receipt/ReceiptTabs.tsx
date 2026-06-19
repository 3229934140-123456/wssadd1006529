import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Receipt, ReceiptType } from '@/types';
import ReceiptCard from './ReceiptCard';
import {
  MessageCircle,
  CreditCard as AlipayIcon,
  Banknote,
  CreditCard,
  Percent,
  RotateCcw,
  Wallet,
  LayoutGrid,
} from 'lucide-react';

interface ReceiptTabsProps {
  receipts: Receipt[];
  onReceiptClick?: (receipt: Receipt) => void;
  selectedReceiptIds?: string[];
  hideDecoy?: boolean;
  hideExamSpoilers?: boolean;
}

type TabKey =
  | 'all'
  | 'wechat'
  | 'alipay'
  | 'cash'
  | 'card'
  | 'discount'
  | 'refund'
  | 'member';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  types?: ReceiptType[];
}

const tabs: TabConfig[] = [
  {
    key: 'all',
    label: '全部',
    icon: <LayoutGrid className="w-4 h-4" />,
    color: 'text-gray-600',
    activeColor: 'bg-gray-900 text-white',
  },
  {
    key: 'wechat',
    label: '微信',
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-green-600',
    activeColor: 'bg-green-500 text-white',
    types: ['wechat'],
  },
  {
    key: 'alipay',
    label: '支付宝',
    icon: <AlipayIcon className="w-4 h-4" />,
    color: 'text-blue-600',
    activeColor: 'bg-blue-500 text-white',
    types: ['alipay'],
  },
  {
    key: 'cash',
    label: '现金',
    icon: <Banknote className="w-4 h-4" />,
    color: 'text-orange-600',
    activeColor: 'bg-orange-500 text-white',
    types: ['cash'],
  },
  {
    key: 'card',
    label: '刷卡',
    icon: <CreditCard className="w-4 h-4" />,
    color: 'text-purple-600',
    activeColor: 'bg-purple-500 text-white',
    types: ['card'],
  },
  {
    key: 'discount',
    label: '减免',
    icon: <Percent className="w-4 h-4" />,
    color: 'text-gray-600',
    activeColor: 'bg-gray-500 text-white',
    types: ['discount'],
  },
  {
    key: 'refund',
    label: '退费',
    icon: <RotateCcw className="w-4 h-4" />,
    color: 'text-red-600',
    activeColor: 'bg-red-500 text-white',
    types: ['refund'],
  },
  {
    key: 'member',
    label: '会员',
    icon: <Wallet className="w-4 h-4" />,
    color: 'text-teal-600',
    activeColor: 'bg-teal-500 text-white',
    types: ['member_recharge', 'member_consume'],
  },
];

export default function ReceiptTabs({
  receipts,
  onReceiptClick,
  selectedReceiptIds = [],
  hideDecoy = false,
  hideExamSpoilers = false,
}: ReceiptTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const counts = useMemo(() => {
    const result: Record<TabKey, number> = {
      all: receipts.length,
      wechat: 0,
      alipay: 0,
      cash: 0,
      card: 0,
      discount: 0,
      refund: 0,
      member: 0,
    };

    receipts.forEach((r) => {
      if (r.type === 'wechat') result.wechat++;
      else if (r.type === 'alipay') result.alipay++;
      else if (r.type === 'cash') result.cash++;
      else if (r.type === 'card') result.card++;
      else if (r.type === 'discount') result.discount++;
      else if (r.type === 'refund') result.refund++;
      else if (r.type === 'member_recharge' || r.type === 'member_consume')
        result.member++;
    });

    return result;
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    if (activeTab === 'all') return receipts;
    const activeTabConfig = tabs.find((t) => t.key === activeTab);
    if (!activeTabConfig?.types) return receipts;
    return receipts.filter((r) => activeTabConfig.types!.includes(r.type));
  }, [receipts, activeTab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key];

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? cn('shadow-sm', tab.activeColor)
                  : cn(
                      'text-gray-600 hover:bg-white hover:text-gray-900',
                      tab.color
                    )
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={cn(
                  'min-w-[20px] h-5 px-1.5 rounded-full text-xs flex items-center justify-center font-semibold',
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-200 text-gray-600'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredReceipts.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <LayoutGrid className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无该类型凭证</p>
          </div>
        ) : (
          filteredReceipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              selected={selectedReceiptIds.includes(receipt.id)}
              onClick={() => onReceiptClick?.(receipt)}
              hideDecoy={hideDecoy}
              hideExamSpoilers={hideExamSpoilers}
            />
          ))
        )}
      </div>
    </div>
  );
}
