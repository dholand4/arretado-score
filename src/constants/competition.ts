import type {
  CriterioDesempate,
  ICompeticaoPontuacao,
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

export const TODOS_CRITERIOS = Object.keys(CRITERIOS_DESEMPATE) as CriterioDesempate[];

type ScoringPreset = Pick<
  ICompeticaoPontuacao,
  'pontos_vitoria' | 'pontos_derrota' | 'pontos_derrota_wo' | 'permite_empate' | 'pontos_empate'
>;

// Seção 5, etapa 2.
export const SCORING_PRESETS: Record<'padrao' | 'fiba' | 'futsal', { label: string; values: ScoringPreset }> = {
  padrao: {
    label: 'Usar padrão',
    values: { pontos_vitoria: 1, pontos_derrota: 0, pontos_derrota_wo: 0, permite_empate: false, pontos_empate: 0 },
  },
  fiba: {
    label: 'Usar padrão FIBA',
    values: { pontos_vitoria: 2, pontos_derrota: 1, pontos_derrota_wo: 0, permite_empate: false, pontos_empate: 0 },
  },
  futsal: {
    label: 'Usar padrão futsal',
    values: { pontos_vitoria: 3, pontos_derrota: 0, pontos_derrota_wo: 0, permite_empate: true, pontos_empate: 1 },
  },
};

export const INTERVALO_PADRAO_MIN = 90;
export const MIN_TIMES_PARA_INICIAR = 2;

export const WIZARD_STEPS = [
  { key: 'dados', label: 'Dados básicos', available: true },
  { key: 'pontuacao', label: 'Pontuação e W.O.', available: true },
  { key: 'estatisticas', label: 'Estatísticas', available: true },
  { key: 'fases', label: 'Fases', available: false },
  { key: 'cobranca', label: 'Cobrança', available: false },
  { key: 'revisao', label: 'Revisão', available: true },
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]['key'];
