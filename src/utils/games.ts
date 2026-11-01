import type { BadgeTone } from '@/components/badgeGlobal';
import type { StatusJogo } from '@/@types/event';
import type { IJogoLista } from '@/@types/game';
import { STATUS_JOGO } from '@/constants/phase';
import { formatDateTime } from './date';
import { gameSides, type IDayContext } from './eventSchedule';

export interface IGameFilters {
  faseId: string;
  timeId: string;
  status: StatusJogo | '';
}

// Fase que a tela de jogos abre: a que está em andamento; com tudo encerrado, a última concluída.
export function currentPhaseId(fases: { id: string; ordem: number; status: string }[]): string {
  const ordenadas = [...fases].sort((a, b) => a.ordem - b.ordem);
  const emAndamento = ordenadas.find((fase) => fase.status === 'em_andamento');
  const ultimaConcluida = ordenadas.filter((fase) => fase.status === 'concluida').at(-1);
  return emAndamento?.id ?? ultimaConcluida?.id ?? '';
}

export function filterGames(jogos: IJogoLista[], { faseId, timeId, status }: IGameFilters): IJogoLista[] {
  return jogos.filter(
    (jogo) =>
      (!faseId || jogo.fase_id === faseId) &&
      (!timeId || jogo.time_casa_id === timeId || jogo.time_fora_id === timeId) &&
      (!status || jogo.status === status),
  );
}

// Pendente amarelo, agendado verde, encerrado vermelho; W.O. e cancelado sem destaque.
const STATUS_TONE: Record<StatusJogo, BadgeTone> = {
  pendente: 'warning',
  agendado: 'success',
  encerrado: 'danger',
  wo: 'neutral',
  cancelado: 'neutral',
};

export function gameStatus(status: StatusJogo) {
  return { label: STATUS_JOGO[status], tone: STATUS_TONE[status] };
}

// Textos do cartão de jogo: lados (ou confronto condicional), descrição e "Jogo N" do dia.
export function gameCardTexts(jogo: IJogoLista, dia: IDayContext) {
  const numero = dia.numeros.get(jogo.id);
  return {
    ...gameSides(jogo, dia.dependentes),
    description: describeGame(jogo),
    order: numero ? `Jogo ${numero}` : undefined,
  };
}

// "Fase de classificação · 25/10/2026 19:00 · Ginásio". A rodada não aparece: jogos são mostrados pela
// fase (e grupo ou série), não pelo número da rodada.
export function describeGame(jogo: IJogoLista): string {
  const partes = [
    jogo.fase?.nome,
    jogo.grupo && `Grupo ${jogo.grupo.nome}`,
    jogo.serie && `${jogo.serie.codigo} · Jogo ${jogo.numero_na_serie}`,
    jogo.inicio_previsto ? formatDateTime(jogo.inicio_previsto) : 'Sem data',
    jogo.evento?.local,
  ];
  return partes.filter(Boolean).join(' · ');
}

export function hasResult(jogo: Pick<IJogoLista, 'status'>): boolean {
  return jogo.status === 'encerrado' || jogo.status === 'wo';
}
