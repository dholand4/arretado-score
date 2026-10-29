import type { IEventoInput, IJogoResumo, IMontagemEvento } from '@/@types/event';
import { HORA_INICIO_PADRAO, QTD_JOGOS_PADRAO } from '@/constants/phase';
import type { FormErrors } from './competitionValidators';
import { TIME_ZONE } from './date';
import { pluralize } from './text';

const isoDate = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const hora = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });
// A data do evento é um dia "puro" (sem fuso): formata ao meio-dia UTC para não trocar de dia.
const diaEvento = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function todayInFortaleza(now: Date = new Date()): string {
  return isoDate.format(now);
}

export function formatEventDate(date: string): string {
  return diaEvento.format(new Date(`${date}T12:00:00Z`));
}

export function formatTime(iso: string | null | undefined): string {
  return iso ? hora.format(new Date(iso)) : '—';
}

// "19:00:00" (coluna time) → "19:00".
export function shortTime(value: string): string {
  return value.slice(0, 5);
}

export function teamName(team: IJogoResumo['casa']): string {
  return team?.sigla || team?.nome || '?';
}

export function gameLabel(jogo: IJogoResumo): string {
  return `${jogo.casa?.nome ?? '?'} x ${jogo.fora?.nome ?? '?'}`;
}

export function gameDetails(jogo: IJogoResumo): string {
  const partes = [jogo.fase?.nome];
  if (jogo.grupo) partes.push(`Grupo ${jogo.grupo.nome}`);
  if (jogo.rodada) partes.push(`Rodada ${jogo.rodada}`);
  if (jogo.serie) partes.push(`${jogo.serie.codigo}, jogo ${jogo.numero_na_serie ?? 1}`);
  return partes.filter(Boolean).join(' · ');
}

// Times que aparecem mais de uma vez no dia (jogo duplo).
export function doubledTeams(jogos: IJogoResumo[]): Set<string> {
  const vezes = new Map<string, number>();
  jogos.forEach((j) => [j.time_casa_id, j.time_fora_id].forEach((t) => vezes.set(t, (vezes.get(t) ?? 0) + 1)));
  return new Set([...vezes].filter(([, n]) => n > 1).map(([t]) => t));
}

export function defaultEventInput(localPadrao: string | null, intervalo: number, hoje = todayInFortaleza()): IEventoInput {
  return {
    data: hoje,
    local: localPadrao ?? '',
    hora_inicio: HORA_INICIO_PADRAO,
    qtd_jogos: QTD_JOGOS_PADRAO,
    intervalo_min: intervalo,
    observacoes: '',
  };
}

export function validateEvent(values: IEventoInput): FormErrors<IEventoInput> {
  const errors: FormErrors<IEventoInput> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.data)) errors.data = 'Informe a data.';
  if (!values.local.trim()) errors.local = 'Informe o local.';
  if (!/^\d{2}:\d{2}/.test(values.hora_inicio)) errors.hora_inicio = 'Informe a hora de início.';
  if (!Number.isInteger(values.qtd_jogos) || values.qtd_jogos < 1) errors.qtd_jogos = 'Informe ao menos 1 jogo.';
  if (!Number.isInteger(values.intervalo_min) || values.intervalo_min < 1) {
    errors.intervalo_min = 'Informe o intervalo em minutos.';
  }
  return errors;
}

// Texto do aviso da seção 6.2.
export function doubleGameMessage(montagem: IMontagemEvento): string {
  const base = `Só é possível montar ${pluralize(montagem.max_sem_repeticao, 'jogo', 'jogos')} sem repetir time. Deseja permitir jogo duplo?`;
  return montagem.candidatos < montagem.pedido
    ? `${base} Há só ${pluralize(montagem.candidatos, 'jogo disponível', 'jogos disponíveis')} no momento.`
    : base;
}

// Aviso depois de montar: menos jogos que o pedido, ou jogo duplo incluído.
export function assemblyNotice(montagem: IMontagemEvento): string | null {
  const montados = montagem.jogos.length;
  if (montados < montagem.pedido) {
    return `Havia só ${pluralize(montados, 'jogo disponível', 'jogos disponíveis')}: o dia foi montado com ${pluralize(montados, 'jogo', 'jogos')} em vez de ${montagem.pedido}.`;
  }
  if (montagem.jogo_duplo) return 'O dia foi montado com jogo duplo: confira a ordem dos jogos.';
  return null;
}
