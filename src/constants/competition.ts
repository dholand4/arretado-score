import type {
  CriterioDesempate,
  Modalidade,
  StatusCompeticao,
} from '@/@types/competition';
import type { BadgeTone } from '@/components/badgeGlobal';

export const MODALIDADE_LABEL: Record<Modalidade, string> = {
  basquete: 'Basquete',
  futsal: 'Futsal',
  volei: 'Vôlei',
  outro: 'Outro',
};

export const MODALIDADE_OPTIONS = (Object.keys(MODALIDADE_LABEL) as Modalidade[]).map((value) => ({
  value,
  label: MODALIDADE_LABEL[value],
}));

export const STATUS_COMPETICAO: Record<StatusCompeticao, { label: string; tone: BadgeTone }> = {
  rascunho: { label: 'Rascunho', tone: 'warning' },
  em_andamento: { label: 'Em andamento', tone: 'success' },
  encerrada: { label: 'Encerrada', tone: 'neutral' },
};

export const CRITERIOS_DESEMPATE: Record<CriterioDesempate, { label: string; description: string }> = {
  confronto_direto: {
    label: 'Confronto direto',
    description: 'Pontos e depois saldo só nos jogos entre os empatados.',
  },
  saldo: { label: 'Saldo', description: 'Saldo de pontos/gols na fase.' },
  pontos_pro: { label: 'Pontos pró', description: 'Pontos/gols marcados na fase.' },
  vitorias: { label: 'Vitórias', description: 'Número de vitórias (útil no modelo FIBA).' },
};

// Desempate fixo depois dos pontos na tabela (vitórias): saldo e confronto direto.
export const CRITERIOS_FIXOS: CriterioDesempate[] = ['saldo', 'confronto_direto'];

export const INTERVALO_PADRAO_MIN = 90;
export const MIN_TIMES_PARA_INICIAR = 2;

export const WIZARD_STEPS = [
  { key: 'dados', label: 'Dados básicos', available: true },
  { key: 'regras', label: 'Regras', available: true },
  { key: 'pontuacao', label: 'Pontuação', available: true },
  { key: 'estatisticas', label: 'Estatísticas', available: true },
  { key: 'fases', label: 'Fases', available: true },
  { key: 'cobranca', label: 'Cobrança', available: true },
  { key: 'times', label: 'Times', available: true },
  { key: 'revisao', label: 'Revisão', available: true },
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]['key'];

// Categoria preenchida sozinha pela súmula ao vivo: quantos lances de +1, +2 ou +3 o jogador converteu.
export const CONTA_CESTAS_OPCOES: { value: number | null; label: string; short: string }[] = [
  { value: null, label: 'Não, digitar na súmula', short: '' },
  { value: 1, label: 'Lances livres convertidos (+1)', short: 'lances de +1' },
  { value: 2, label: 'Cestas de 2 (+2)', short: 'cestas de 2' },
  { value: 3, label: 'Cestas de 3 (+3)', short: 'cestas de 3' },
];
