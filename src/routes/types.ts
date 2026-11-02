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
  myTeamHome: '/painel/meus-times/:teamId/inicio',
  myTeamGames: '/painel/meus-times/:teamId/jogos',
  myTeamHighlights: '/painel/meus-times/:teamId/destaques',
  myTeamStandings: '/painel/meus-times/:teamId/tabela',
  myTeamBracket: '/painel/meus-times/:teamId/playoffs',
  // Etapa 3
  competitionEvents: '/painel/competicoes/:competitionId/eventos',
  // Etapa 4
  competitionGames: '/painel/competicoes/:competitionId/jogos',
  gameScoreSheet: '/painel/competicoes/:competitionId/jogos/:gameId/sumula',
  gamePrintSheet: '/painel/competicoes/:competitionId/jogos/:gameId/sumula/imprimir',
  // Etapa 9
  gameLiveSheet: '/painel/competicoes/:competitionId/jogos/:gameId/mesa',
  // Mesário pelo link (sem login) e placar em tela cheia (telão), fora do painel e da área pública.
  mesaLink: '/mesa/:token',
  scoreboard: '/placar/:gameId',
  publicStandings: '/c/:slug/tabela',
  publicPlayoffs: '/c/:slug/playoffs',
  // Etapa 6
  publicCompetition: '/c/:slug',
  publicGames: '/c/:slug/jogos',
  publicGame: '/c/:slug/jogos/:gameId',
  publicRankings: '/c/:slug/rankings',
  publicTeams: '/c/:slug/times',
  publicTeam: '/c/:slug/times/:teamId',
  // Etapa 7
  competitionFinance: '/painel/competicoes/:competitionId/financeiro',
  competitionHighlights: '/painel/competicoes/:competitionId/destaques',
  competitionStandings: '/painel/competicoes/:competitionId/tabela',
  competitionBracket: '/painel/competicoes/:competitionId/playoffs',
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
  myTeamHome: (teamId: string) => `/painel/meus-times/${teamId}/inicio` as const,
  myTeamGames: (teamId: string) => `/painel/meus-times/${teamId}/jogos` as const,
  myTeamHighlights: (teamId: string) => `/painel/meus-times/${teamId}/destaques` as const,
  myTeamStandings: (teamId: string) => `/painel/meus-times/${teamId}/tabela` as const,
  myTeamBracket: (teamId: string) => `/painel/meus-times/${teamId}/playoffs` as const,
  competitionEvents: (competitionId: string) => `/painel/competicoes/${competitionId}/eventos` as const,
  competitionGames: (competitionId: string) => `/painel/competicoes/${competitionId}/jogos` as const,
  gameScoreSheet: (competitionId: string, gameId: string) =>
    `/painel/competicoes/${competitionId}/jogos/${gameId}/sumula` as const,
  gamePrintSheet: (competitionId: string, gameId: string) =>
    `/painel/competicoes/${competitionId}/jogos/${gameId}/sumula/imprimir` as const,
  gameLiveSheet: (competitionId: string, gameId: string) =>
    `/painel/competicoes/${competitionId}/jogos/${gameId}/mesa` as const,
  mesaLink: (token: string) => `/mesa/${token}` as const,
  scoreboard: (gameId: string) => `/placar/${gameId}` as const,
  publicStandings: (slug: string) => `/c/${slug}/tabela` as const,
  publicPlayoffs: (slug: string) => `/c/${slug}/playoffs` as const,
  publicCompetition: (slug: string) => `/c/${slug}` as const,
  publicGames: (slug: string) => `/c/${slug}/jogos` as const,
  publicGame: (slug: string, gameId: string) => `/c/${slug}/jogos/${gameId}` as const,
  publicRankings: (slug: string) => `/c/${slug}/rankings` as const,
  publicTeams: (slug: string) => `/c/${slug}/times` as const,
  publicTeam: (slug: string, teamId: string) => `/c/${slug}/times/${teamId}` as const,
  competitionFinance: (competitionId: string) => `/painel/competicoes/${competitionId}/financeiro` as const,
  competitionHighlights: (competitionId: string) => `/painel/competicoes/${competitionId}/destaques` as const,
  competitionStandings: (competitionId: string) => `/painel/competicoes/${competitionId}/tabela` as const,
  competitionBracket: (competitionId: string) => `/painel/competicoes/${competitionId}/playoffs` as const,
};

type StaticPath = (typeof ROUTES)[keyof typeof ROUTES];
type DynamicPath = ReturnType<(typeof paths)[keyof typeof paths]>;
export type RoutePath = StaticPath | DynamicPath;

export interface IRouteParams {
  competitionId: string;
  teamId: string;
  gameId: string;
  slug: string;
  token: string;
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

// Estado enviado pela súmula ao voltar para a lista de jogos depois de salvar.
export interface IGamesRouteState {
  notice?: string;
}

// Estado enviado ao abrir um time: aberto pela etapa Times da configuração, o voltar leva de volta para lá.
export interface ITeamRouteState {
  origem?: 'configuracao';
}
