import type { ICobranca, IResumoFinanceiro, StatusCobranca } from '@/@types/finance';
import type { StatusExibicao } from '@/constants/finance';
import { TIME_ZONE } from './date';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const mesFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dataFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });

export const formatCurrency = (valor: number) => moeda.format(valor);

// Datas "YYYY-MM-DD" do banco são dias de calendário: formatadas em UTC para não mudar o dia.
export const formatMonth = (referencia: string) => {
  const texto = mesFormat.format(new Date(`${referencia}T00:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};
export const formatDate = (dia: string | null) => (dia ? dataFormat.format(new Date(`${dia}T00:00:00Z`)) : '—');

// Hoje no fuso da competição, como "YYYY-MM-DD".
export function todayInFortaleza(agora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(agora);
}

export const firstDayOfMonth = (dia: string) => `${dia.slice(0, 7)}-01`;

export function displayStatus(item: { status: StatusCobranca; vencimento?: string }, hoje: string): StatusExibicao {
  if (item.status === 'pendente' && item.vencimento && item.vencimento < hoje) return 'atrasado';
  return item.status;
}

export interface IChargeFilters {
  referencia: string;
  timeId: string;
  status: StatusExibicao | '';
}

export function filterCharges(cobrancas: ICobranca[], filtros: IChargeFilters, hoje: string): ICobranca[] {
  return cobrancas.filter(
    (c) =>
      (!filtros.referencia || c.referencia === filtros.referencia) &&
      (!filtros.timeId || c.time_id === filtros.timeId) &&
      (!filtros.status || displayStatus(c, hoje) === filtros.status),
  );
}

// Cards da tela Financeiro (8.1) sobre as cobranças filtradas.
export function summarize(cobrancas: ICobranca[], hoje: string): IResumoFinanceiro {
  return cobrancas.reduce<IResumoFinanceiro>(
    (resumo, c) => {
      const valor = Number(c.valor);
      if (c.status !== 'isento') resumo.previsto += valor;
      if (c.status === 'pago') resumo.recebido += valor;
      if (c.status === 'pendente') resumo.pendente += valor;
      if (displayStatus(c, hoje) === 'atrasado') resumo.emAtraso += 1;
      return resumo;
    },
    { previsto: 0, recebido: 0, pendente: 0, emAtraso: 0 },
  );
}

export function monthOptions(cobrancas: { referencia: string }[]) {
  return [...new Set(cobrancas.map((c) => c.referencia))].sort().map((ref) => ({ value: ref, label: formatMonth(ref) }));
}

export function receiptExtension(file: File): string {
  if (file.type === 'application/pdf') return 'pdf';
  return 'webp';
}
