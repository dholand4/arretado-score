import type { ICategoria, ITimeResumo } from '@/@types/competition';
import type { IJogoAndamento } from '@/@types/event';
import type { IFase } from '@/@types/phase';
import { MIN_TIMES_PARA_INICIAR, type WizardStepKey } from '@/constants/competition';
import { pluralize } from './text';

export interface IChecklistItem {
  key: string;
  label: string;
  done: boolean;
  pending?: boolean;
  step?: WizardStepKey;
  goToTeams?: boolean;
  goToEvents?: boolean;
}

// "Próximos passos" da visão geral da competição em rascunho.
export function buildChecklist(categories: ICategoria[], teams: ITimeResumo[], phasesCount = 0): IChecklistItem[] {
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
    {
      key: 'fases',
      label: phasesCount > 0 ? `Fases: ${pluralize(phasesCount, 'configurada', 'configuradas')}` : 'Configure as fases',
      done: phasesCount > 0,
      step: 'fases',
    },
  ];
}

// "Próximos passos" com a competição em andamento: fase atual, jogos sem dia e súmulas que faltam.
export function buildProgressChecklist(phases: IFase[], games: IJogoAndamento[]): IChecklistItem[] {
  const atual = phases.find((p) => p.status === 'em_andamento');
  if (!atual) return [];
  const daFase = games.filter((g) => g.fase_id === atual.id);
  const semDia = daFase.filter((g) => g.status === 'pendente').length;
  const faltam = daFase.filter((g) => g.status === 'pendente' || g.status === 'agendado').length;

  if (daFase.length === 0) {
    return [{ key: 'jogos', label: `${atual.nome}: aguardando os jogos das séries`, done: false, pending: true }];
  }
  return [
    {
      key: 'dias',
      label: semDia
        ? `${pluralize(semDia, 'jogo', 'jogos')} da ${atual.nome} sem dia definido`
        : `Todos os jogos da ${atual.nome} têm dia`,
      done: semDia === 0,
      goToEvents: true,
    },
    {
      key: 'sumulas',
      label: faltam
        ? `Faltam ${pluralize(faltam, 'súmula', 'súmulas')} para fechar a ${atual.nome}`
        : `Todas as súmulas da ${atual.nome} foram lançadas`,
      done: faltam === 0,
    },
  ];
}
