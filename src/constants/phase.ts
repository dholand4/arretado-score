import type { StatusEvento, StatusJogo } from '@/@types/event';
import type { Cruzamento, MelhorDe, ResultadoOrigem, SorteioGrupos, StatusFase, TipoFase } from '@/@types/phase';
import type { BadgeTone } from '@/components/badgeGlobal';

export const TIPO_FASE_LABEL: Record<TipoFase, string> = {
  todos_contra_todos: 'Todos contra todos',
  grupos: 'Grupos',
  mata_mata: 'Mata-mata',
};

export const TIPO_FASE_OPTIONS = (Object.keys(TIPO_FASE_LABEL) as TipoFase[]).map((value) => ({
  value,
  label: TIPO_FASE_LABEL[value],
}));

export const CRUZAMENTO_LABEL: Record<Cruzamento, { label: string; description: string }> = {
  por_campanha: {
    label: 'Por campanha',
    description: '1º x último, 2º x penúltimo… pela campanha na fase anterior.',
  },
  cruzado_grupos: { label: 'Cruzado entre grupos', description: '1ºA x 2ºB, 1ºB x 2ºA, 1ºC x 2ºD…' },
  vencedores: { label: 'Vencedores', description: 'Vencedor da série 1 x vencedor da série 2, 3 x 4…' },
  outra_fase: {
    label: 'Vencedores ou perdedores de uma fase',
    description: 'Escolha uma fase de mata-mata anterior e quem entra: série 1 x série 2, 3 x 4… Ex.: 3º lugar com os perdedores da semifinal.',
  },
  manual: { label: 'Manual', description: 'Você define cada confronto com as origens disponíveis.' },
};

export const CRUZAMENTO_OPTIONS = (Object.keys(CRUZAMENTO_LABEL) as Cruzamento[]).map((value) => ({
  value,
  label: CRUZAMENTO_LABEL[value].label,
}));

export const RESULTADO_ORIGEM_OPTIONS: { value: ResultadoOrigem; label: string }[] = [
  { value: 'vencedores', label: 'Vencedores' },
  { value: 'perdedores', label: 'Perdedores' },
];

export const MELHOR_DE_OPTIONS: { value: MelhorDe; label: string }[] = [
  { value: 1, label: 'Jogo único' },
  { value: 3, label: 'Melhor de 3' },
  { value: 5, label: 'Melhor de 5' },
  { value: 7, label: 'Melhor de 7' },
];

export const SORTEIO_GRUPOS_LABEL: Record<SorteioGrupos, string> = {
  aleatorio: 'Sorteio aleatório equilibrado',
  manual: 'Distribuição manual',
};

export const STATUS_FASE: Record<StatusFase, { label: string; tone: BadgeTone }> = {
  aguardando: { label: 'Aguardando', tone: 'neutral' },
  em_andamento: { label: 'Em andamento', tone: 'success' },
  concluida: { label: 'Concluída', tone: 'info' },
};

export const STATUS_EVENTO: Record<StatusEvento, { label: string; tone: BadgeTone }> = {
  rascunho: { label: 'Rascunho', tone: 'warning' },
  publicado: { label: 'Publicado', tone: 'success' },
};

export const STATUS_JOGO: Record<StatusJogo, string> = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  encerrado: 'Encerrado',
  wo: 'W.O.',
  cancelado: 'Cancelado',
};

export const QTD_JOGOS_PADRAO = 2;
export const HORA_INICIO_PADRAO = '19:00';
