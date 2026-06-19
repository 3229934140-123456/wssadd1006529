export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card' | 'member' | 'installment';

export type ReceiptType = 'wechat' | 'alipay' | 'cash' | 'card' | 'discount' | 'refund' | 'member_recharge' | 'member_consume';

export type IssueType =
  | 'not_received'
  | 'duplicate_payment'
  | 'missing_invoice'
  | 'refund_not_recorded'
  | 'amount_mismatch'
  | 'discount_not_approved'
  | 'wrong_payment_method';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Scene {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  duration: number;
  patientCount: number;
  icon: string;
  background: string;
  learningObjectives: string[];
  tips: string[];
  category: string;
}

export interface FeedbackDetail {
  isCorrect: boolean;
  explanation: string;
  knowledgePoint: string;
  example: string;
}

export interface Patient {
  id: string;
  sceneId: string;
  name: string;
  gender: '男' | '女';
  age: number;
  treatmentItem: string;
  doctor: string;
  receivableAmount: number;
  paymentMethod: PaymentMethod;
  expectedReceiptIds: string[];
  issues: IssueType[];
  feedback: FeedbackDetail;
}

export interface Receipt {
  id: string;
  sceneId: string;
  type: ReceiptType;
  amount: number;
  patientId?: string;
  payerName?: string;
  timestamp: string;
  transactionId?: string;
  cardLast4?: string;
  note?: string;
  isDecoy?: boolean;
}

export interface ReconciliationResult {
  patientId: string;
  matchedReceiptIds: string[];
  selectedIssues: IssueType[];
  isMatchCorrect: boolean;
  isIssueCorrect: boolean;
  totalCorrect: boolean;
}

export interface PracticeState {
  currentSceneId: string | null;
  step: 'select' | 'bill' | 'reconcile' | 'feedback';
  matchedReceipts: Record<string, string[]>;
  patientIssues: Record<string, IssueType[]>;
  results: ReconciliationResult[] | null;
  score: number | null;
}

export const RECEIPT_TYPE_LABELS: Record<ReceiptType, string> = {
  wechat: '微信收款',
  alipay: '支付宝收款',
  cash: '现金收款',
  card: 'POS刷卡',
  discount: '医生减免',
  refund: '退费单',
  member_recharge: '会员卡充值',
  member_consume: '会员卡消费',
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  not_received: '未到账',
  duplicate_payment: '重复收款',
  missing_invoice: '漏开票',
  refund_not_recorded: '退费未登记',
  amount_mismatch: '金额不符',
  discount_not_approved: '减免未审批',
  wrong_payment_method: '支付方式错误',
};

export const ISSUE_TYPE_COLORS: Record<IssueType, string> = {
  not_received: 'bg-red-100 text-red-700 border-red-200',
  duplicate_payment: 'bg-orange-100 text-orange-700 border-orange-200',
  missing_invoice: 'bg-amber-100 text-amber-700 border-amber-200',
  refund_not_recorded: 'bg-rose-100 text-rose-700 border-rose-200',
  amount_mismatch: 'bg-pink-100 text-pink-700 border-pink-200',
  discount_not_approved: 'bg-purple-100 text-purple-700 border-purple-200',
  wrong_payment_method: 'bg-violet-100 text-violet-700 border-violet-200',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  card: '银行卡',
  member: '会员卡',
  installment: '分期付款',
};
