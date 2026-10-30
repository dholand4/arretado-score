import type {
  INovoDonoInput,
  ICategoriaInput,
  ICompeticaoBasicos,
  ICompeticaoPontuacao,
  IJogadorInput,
  ITimeInput,
} from '@/@types/competition';
import type { ICompeticaoCobranca } from '@/@types/finance';
import { isValidSlug } from './slugify';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

const isNonNegativeInt = (value: number) => Number.isInteger(value) && value >= 0;

export function validateBasics(values: ICompeticaoBasicos): FormErrors<ICompeticaoBasicos> {
  const errors: FormErrors<ICompeticaoBasicos> = {};
  if (!values.nome.trim()) errors.nome = 'Informe o nome da competição.';
  if (!isValidSlug(values.slug)) errors.slug = 'Use só letras minúsculas, números e hífens (ex.: liga-2026).';
  if (!Number.isInteger(values.intervalo_jogos_min) || values.intervalo_jogos_min <= 0) {
    errors.intervalo_jogos_min = 'Informe um intervalo em minutos maior que zero.';
  }
  return errors;
}

export function validateScoring(values: ICompeticaoPontuacao): FormErrors<ICompeticaoPontuacao> {
  const errors: FormErrors<ICompeticaoPontuacao> = {};
  const numeric = [
    'pontos_vitoria',
    'pontos_derrota',
    'pontos_derrota_wo',
    'pontos_empate',
    'wo_placar_vencedor',
    'wo_placar_perdedor',
  ] as const;
  for (const field of numeric) {
    if (!isNonNegativeInt(values[field])) errors[field] = 'Use um número inteiro, zero ou maior.';
  }
  if (!errors.wo_placar_vencedor && values.wo_placar_vencedor <= values.wo_placar_perdedor) {
    errors.wo_placar_vencedor = 'O placar do vencedor por W.O. precisa ser maior que o do perdedor.';
  }
  return errors;
}

export function validateCategory(values: ICategoriaInput): FormErrors<ICategoriaInput> {
  const errors: FormErrors<ICategoriaInput> = {};
  if (!values.nome.trim()) errors.nome = 'Informe o nome.';
  const sigla = values.sigla.trim();
  if (!sigla || sigla.length > 5) errors.sigla = 'Use de 1 a 5 caracteres.';
  if (!values.titulo_ranking.trim()) errors.titulo_ranking = 'Informe o título do ranking.';
  return errors;
}

export function validateTeam(values: ITimeInput): FormErrors<ITimeInput> {
  const errors: FormErrors<ITimeInput> = {};
  if (!values.nome.trim()) errors.nome = 'Informe o nome do time.';
  if (values.sigla && !/^[A-Z0-9]{1,4}$/.test(values.sigla)) errors.sigla = 'Até 4 letras ou números.';
  return errors;
}

export function validateNewOwner(values: INovoDonoInput): FormErrors<INovoDonoInput> {
  const errors: FormErrors<INovoDonoInput> = {};
  if (!values.nome.trim()) errors.nome = 'Informe o nome do responsável pela equipe.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Informe um e-mail válido (ex.: nome@gmail.com).';
  if (values.senha.length < 8) errors.senha = 'Use pelo menos 8 caracteres.';
  return errors;
}

export function validatePlayer(values: IJogadorInput): FormErrors<IJogadorInput> {
  const errors: FormErrors<IJogadorInput> = {};
  if (!values.nome.trim()) errors.nome = 'Informe o nome.';
  if (values.numero !== null && (!Number.isInteger(values.numero) || values.numero < 0 || values.numero > 999)) {
    errors.numero = 'Número de 0 a 999.';
  }
  return errors;
}

export function hasErrors<T>(errors: FormErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}

// Campo numérico de formulário: vazio vira NaN (inválido) ou null, conforme o caso.
export function parseIntField(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value);
}

export function parseOptionalInt(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

export function validateBilling(values: ICompeticaoCobranca): FormErrors<ICompeticaoCobranca> {
  const errors: FormErrors<ICompeticaoCobranca> = {};
  if (values.cobranca_modelo === 'nenhuma') return errors;
  if (values.cobranca_valor === null || Number.isNaN(values.cobranca_valor) || values.cobranca_valor <= 0) {
    errors.cobranca_valor = 'Informe um valor maior que zero.';
  }
  const dia = values.cobranca_dia_vencimento;
  if (dia === null || !Number.isInteger(dia) || dia < 1 || dia > 28) errors.cobranca_dia_vencimento = 'Escolha um dia de 1 a 28.';
  if (!values.cobranca_mes_inicio) errors.cobranca_mes_inicio = 'Informe o mês de início.';
  const meses = values.cobranca_qtd_meses;
  if (meses === null || !Number.isInteger(meses) || meses < 1) errors.cobranca_qtd_meses = 'Informe ao menos 1 mês.';
  return errors;
}
