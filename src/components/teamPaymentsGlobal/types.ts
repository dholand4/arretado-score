import type { IPagamentoInterno, StatusCobranca } from '@/@types/finance';

export interface ITeamPaymentsProps {
  payments: IPagamentoInterno[];
  defaultMonth: string;
  busy?: boolean;
  error?: string | null;
  notice?: string | null;
  onGenerate: (referencia: string, valor: number) => void;
  onSetStatus: (id: string, status: StatusCobranca) => void;
}
