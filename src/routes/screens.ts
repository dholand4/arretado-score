import { lazy } from 'react';

// Cada tela vira um pedaço separado do bundle, carregado só quando a rota é aberta.

export const ChangePasswordScreen = lazy(() => import('@/view/changePasswordScreen').then((m) => ({ default: m.ChangePasswordScreen })));
export const CompetitionAdminsScreen = lazy(() => import('@/view/competitionAdminsScreen').then((m) => ({ default: m.CompetitionAdminsScreen })));
export const CompetitionWizardScreen = lazy(() => import('@/view/competitionWizardScreen').then((m) => ({ default: m.CompetitionWizardScreen })));
export const CompetitionsScreen = lazy(() => import('@/view/competitionsScreen').then((m) => ({ default: m.CompetitionsScreen })));
export const EventsScreen = lazy(() => import('@/view/eventsScreen').then((m) => ({ default: m.EventsScreen })));
export const CompetitionBracketScreen = lazy(() =>
  import('@/view/competitionBracketScreen').then((m) => ({ default: m.CompetitionBracketScreen })),
);
export const CompetitionHighlightsScreen = lazy(() =>
  import('@/view/competitionHighlightsScreen').then((m) => ({ default: m.CompetitionHighlightsScreen })),
);
export const CompetitionStandingsScreen = lazy(() =>
  import('@/view/competitionStandingsScreen').then((m) => ({ default: m.CompetitionStandingsScreen })),
);
export const FinanceScreen = lazy(() => import('@/view/financeScreen').then((m) => ({ default: m.FinanceScreen })));
export const GamesScreen = lazy(() => import('@/view/gamesScreen').then((m) => ({ default: m.GamesScreen })));
export const HomeScreen = lazy(() => import('@/view/homeScreen').then((m) => ({ default: m.HomeScreen })));
export const LoginScreen = lazy(() => import('@/view/loginScreen').then((m) => ({ default: m.LoginScreen })));
export const MyTeamDetailScreen = lazy(() => import('@/view/myTeamDetailScreen').then((m) => ({ default: m.MyTeamDetailScreen })));
export const MyTeamLeagueScreen = lazy(() =>
  import('@/view/myTeamLeagueScreen').then((m) => ({ default: m.MyTeamLeagueScreen })),
);
export const MyTeamsScreen = lazy(() => import('@/view/myTeamsScreen').then((m) => ({ default: m.MyTeamsScreen })));
export const NotFoundScreen = lazy(() => import('@/view/notFoundScreen').then((m) => ({ default: m.NotFoundScreen })));
export const PrintScoreSheetScreen = lazy(() =>
  import('@/view/printScoreSheetScreen').then((m) => ({ default: m.PrintScoreSheetScreen })),
);
export const PublicBracketScreen = lazy(() => import('@/view/publicBracketScreen').then((m) => ({ default: m.PublicBracketScreen })));
export const PublicCompetitionScreen = lazy(() => import('@/view/publicCompetitionScreen').then((m) => ({ default: m.PublicCompetitionScreen })));
export const PublicGameScreen = lazy(() => import('@/view/publicGameScreen').then((m) => ({ default: m.PublicGameScreen })));
export const PublicGamesScreen = lazy(() => import('@/view/publicGamesScreen').then((m) => ({ default: m.PublicGamesScreen })));
export const PublicRankingsScreen = lazy(() => import('@/view/publicRankingsScreen').then((m) => ({ default: m.PublicRankingsScreen })));
export const PublicStandingsScreen = lazy(() => import('@/view/publicStandingsScreen').then((m) => ({ default: m.PublicStandingsScreen })));
export const PublicTeamScreen = lazy(() => import('@/view/publicTeamScreen').then((m) => ({ default: m.PublicTeamScreen })));
export const PublicTeamsScreen = lazy(() => import('@/view/publicTeamsScreen').then((m) => ({ default: m.PublicTeamsScreen })));
export const ScoreSheetScreen = lazy(() => import('@/view/scoreSheetScreen').then((m) => ({ default: m.ScoreSheetScreen })));
export const TeamDetailScreen = lazy(() => import('@/view/teamDetailScreen').then((m) => ({ default: m.TeamDetailScreen })));
export const TeamsScreen = lazy(() => import('@/view/teamsScreen').then((m) => ({ default: m.TeamsScreen })));
export const UsersScreen = lazy(() => import('@/view/usersScreen').then((m) => ({ default: m.UsersScreen })));
