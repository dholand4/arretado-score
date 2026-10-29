import { matchPath } from 'react-router-dom';
import type { WizardStepKey } from '@/constants/competition';

export const ROUTES = {
  home: '/',
  login: '/login',
  changePassword: '/trocar-senha',
  panel: '/painel',
  users: '/painel/usuarios',
  competitions: '/painel/competicoes',
  newCompetition: '/painel/competicoes/nova',
  myTeams: '/painel/meus-times',
} as const;

// Padrões com parâmetros, usados na definição das rotas.
export const ROUTE_PATTERNS = {
  competition: '/painel/competicoes/:competitionId',
  competitionSettings: '/painel/competicoes/:competitionId/configuracao',
  competitionTeams: '/painel/competicoes/:competitionId/times',
  competitionTeam: '/painel/competicoes/:competitionId/times/:teamId',
  competitionAdmins: '/painel/competicoes/:competitionId/admins',
  myTeam: '/painel/meus-times/:teamId',
  // Etapa 3
  competitionEvents: '/painel/competicoes/:competitionId/eventos',
  // Etapa 4
  competitionGames: '/painel/competicoes/:competitionId/jogos',
  gameScoreSheet: '/painel/competicoes/:competitionId/jogos/:gameId/sumula',
  publicStandings: '/c/:slug/tabela',
} as const;

// Construtores tipados dos caminhos com parâmetros.
export const paths = {
  competition: (competitionId: string) => `/painel/competicoes/${competitionId}` as const,
  competitionSettings: (competitionId: string, etapa?: WizardStepKey) =>
    `/painel/competicoes/${competitionId}/configuracao${etapa ? (`?etapa=${etapa}` as const) : ('' as const)}` as const,
  competitionTeams: (competitionId: string) => `/painel/competicoes/${competitionId}/times` as const,
  competitionTeam: (competitionId: string, teamId: string) =>
    `/painel/competicoes/${competitionId}/times/${teamId}` as const,
  competitionAdmins: (competitionId: string) => `/painel/competicoes/${competitionId}/admins` as const,
  myTeam: (teamId: string) => `/painel/meus-times/${teamId}` as const,
  competitionEvents: (competitionId: string) => `/painel/competicoes/${competitionId}/eventos` as const,
  competitionGames: (competitionId: string) => `/painel/competicoes/${competitionId}/jogos` as const,
  gameScoreSheet: (competitionId: string, gameId: string) =>
    `/painel/competicoes/${competitionId}/jogos/${gameId}/sumula` as const,
  publicStandings: (slug: string) => `/c/${slug}/tabela` as const,
};

type StaticPath = (typeof ROUTES)[keyof typeof ROUTES];
type DynamicPath = ReturnType<(typeof paths)[keyof typeof paths]>;
export type RoutePath = StaticPath | DynamicPath;

export interface IRouteParams {
  competitionId: string;
  teamId: string;
  gameId: string;
  slug: string;
}

// Estado aceito pela rota de login (para voltar à página que exigiu autenticação).
export interface ILoginRouteState {
  from?: string;
}

const KNOWN_PATTERNS: string[] = [...Object.values(ROUTES), ...Object.values(ROUTE_PATTERNS)];

export function isRoutePath(value: unknown): value is RoutePath {
  if (typeof value !== 'string') return false;
  const pathname = value.split('?')[0];
  return KNOWN_PATTERNS.some((pattern) => matchPath(pattern, pathname) !== null);
}
