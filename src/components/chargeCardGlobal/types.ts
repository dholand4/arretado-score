import type { StatusExibicao } from '@/constants/finance';

export interface IChargeCardProps {
  title: string;
  subtitle: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: StatusExibicao;
  note: string | null;
  hasReceipt: boolean;
  busy?: boolean;
  onMarkPaid: () => void;
  onExempt: () => void;
  onUndo: () => void;
  onOpenReceipt: () => void;
}
