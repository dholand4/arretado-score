import type { ICategoria, ITimeResumo } from '@/@types/competition';
import { MIN_TIMES_PARA_INICIAR, type WizardStepKey } from '@/constants/competition';
import { pluralize } from './text';

export interface IChecklistItem {
  key: string;
  label: string;
  done: boolean;
  pending?: boolean;
  step?: WizardStepKey;
  goToTeams?: boolean;
}

// "Próximos passos" da visão geral da competição em rascunho.
export function buildChecklist(categories: ICategoria[], teams: ITimeResumo[]): IChecklistItem[] {
  const semJogadores = teams.filter((t) => (t.jogadores[0]?.count ?? 0) === 0).length;
  const ativas = categories.filter((c) => c.ativa).length;
  return [
    { key: 'dados', label: 'Dados básicos', done: true, step: 'dados' },
    { key: 'pontuacao', label: 'Pontuação, W.O. e desempate', done: true, step: 'pontuacao' },
    {
      key: 'estatisticas',
      label: `Estatísticas: ${pluralize(ativas, 'categoria ativa', 'categorias ativas')}`,
      done: ativas > 0,
      step: 'estatisticas',
    },
    {
      key: 'times',
      label:
        teams.length >= MIN_TIMES_PARA_INICIAR
          ? `Times: ${pluralize(teams.length, 'cadastrado', 'cadastrados')}`
          : `Cadastre ao menos ${MIN_TIMES_PARA_INICIAR} times (${teams.length} até agora)`,
      done: teams.length >= MIN_TIMES_PARA_INICIAR,
      goToTeams: true,
    },
    {
      key: 'jogadores',
      label: semJogadores ? `${pluralize(semJogadores, 'time', 'times')} sem jogadores` : 'Todos os times têm jogadores',
      done: teams.length > 0 && semJogadores === 0,
      goToTeams: true,
    },
    { key: 'fases', label: 'Configurar as fases e iniciar (próxima etapa)', done: false, pending: true },
  ];
}
