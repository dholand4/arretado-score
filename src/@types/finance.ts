import type { ICompeticao } from './competition';
import type { Tables } from './database';

export type StatusCobranca = 'pendente' | 'pago' | 'isento';

export type ICompeticaoCobranca = Pick<
  ICompeticao,
  'cobranca_modelo' | 'cobranca_valor' | 'cobranca_dia_vencimento' | 'cobranca_mes_inicio' | 'cobranca_qtd_meses'
>;

export type ICobranca = Omit<Tables<'cobrancas'>, 'status'> & {
  status: StatusCobranca;
  time: { nome: string } | null;
  jogador: { nome: string } | null;
};

export type IPagamentoInterno = Omit<Tables<'pagamentos_internos'>, 'status'> & {
  status: StatusCobranca;
  jogador: { nome: string; numero: number | null } | null;
};

export interface IMarcarPagoInput {
  pagoEm: string;
  observacao: string;
  comprovante: File | null;
}

export interface IResumoFinanceiro {
  previsto: number;
  recebido: number;
  pendente: number;
  emAtraso: number;
}
