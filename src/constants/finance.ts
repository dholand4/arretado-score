import type { CobrancaModelo } from '@/@types/competition';
import type { BadgeTone } from '@/components/badgeGlobal';

export const COBRANCA_MODELO_LABEL: Record<CobrancaModelo, string> = {
  nenhuma: 'Sem cobrança',
  por_time: 'Por time',
  por_jogador: 'Por jogador',
};

export const COBRANCA_MODELO_OPTIONS = (Object.keys(COBRANCA_MODELO_LABEL) as CobrancaModelo[]).map((value) => ({
  value,
  label: COBRANCA_MODELO_LABEL[value],
}));

// "Atrasado" não é status gravado: é pendente com vencimento passado (seção 4.6).
export type StatusExibicao = 'pendente' | 'pago' | 'isento' | 'atrasado';

export const STATUS_COBRANCA: Record<StatusExibicao, { label: string; tone: BadgeTone }> = {
  pendente: { label: 'Pendente', tone: 'warning' },
  pago: { label: 'Pago', tone: 'success' },
  isento: { label: 'Isento', tone: 'neutral' },
  atrasado: { label: 'Atrasado', tone: 'danger' },
};

export const ACCEPTED_RECEIPT_TYPES = 'image/jpeg,image/png,image/webp,application/pdf';
