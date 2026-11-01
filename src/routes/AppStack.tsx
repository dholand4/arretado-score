import { Suspense, useState } from 'react';
import { Navigate, Outlet, useMatch, type RouteObject } from 'react-router-dom';
import type { Papel } from '@/@types/user';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { InactiveLeagueNoticeGlobal } from '@/components/inactiveLeagueNoticeGlobal';
import { LeagueHeaderGlobal } from '@/components/leagueHeaderGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PanelLayoutGlobal, type IPanelNavItem, type IPanelNavSection } from '@/components/panelLayoutGlobal';
import { MODALIDADE_LABEL, STATUS_COMPETICAO } from '@/constants/competition';
import { PAPEL_LABEL } from '@/constants/roles';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useAuth } from '@/hooks/useAuth';
import { useCompetition, useCompetitions } from '@/hooks/useCompetitions';
import { useRealtimeCompetitionGames } from '@/hooks/useGames';
import { useConfirmAction } from '@/hooks/useConfirm';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useMyTeams, useTeamSummary } from '@/hooks/useTeams';
import { getErrorMessage } from '@/utils/appError';
import { RequireAuth, RequireRole } from './guards';
import { paths, ROUTE_PATTERNS, ROUTES } from './types';
import {
  CompetitionAdminsScreen,
  CompetitionBracketScreen,
  CompetitionHighlightsScreen,
  CompetitionStandingsScreen,
  CompetitionWizardScreen,
  CompetitionsScreen,
  EventsScreen,
  FinanceScreen,
  GamesScreen,
  LiveScoreSheetScreen,
  MyTeamDetailScreen,
  MyTeamLeagueScreen,
  MyTeamsScreen,
  PrintScoreSheetScreen,
  ScoreSheetScreen,
  TeamDetailScreen,
  TeamsScreen,
  UsersScreen,
} from './screens';

const NAV_ITEMS: (IPanelNavItem & { roles: Papel[] })[] = [
  { to: ROUTES.competitions, label: 'Competições', roles: ['master', 'admin'], end: true },
  { to: ROUTES.myTeams, label: 'Meus times', roles: ['dono_time'], end: true },
  { to: ROUTES.users, label: 'Usuários', roles: ['master', 'admin'] },
];

// Seções da competição aberta (a RLS garante que só admins dela chegam aos dados).
function competitionNavItems(competitionId: string, papel: Papel): IPanelNavItem[] {
  return [
    { to: paths.competitionSettings(competitionId), label: 'Configuração' },
    { to: paths.competitionTeams(competitionId), label: 'Times' },
    { to: paths.competitionFinance(competitionId), label: 'Financeiro' },
    { to: paths.competitionGames(competitionId), label: 'Jogos' },
    { to: paths.competitionEvents(competitionId), label: 'Lançar jogos' },
    { to: paths.competitionHighlights(competitionId), label: 'Destaques' },
    { to: paths.competitionStandings(competitionId), label: 'Tabela' },
    { to: paths.competitionBracket(competitionId), label: 'Playoffs' },
    ...(papel === 'master' ? [{ to: paths.competitionAdmins(competitionId), label: 'Coordenadores' }] : []),
  ];
}

// Seções da liga vistas pelo dono do time (mesmas informações da área pública, mais o elenco).
function myTeamNavItems(teamId: string): IPanelNavItem[] {
  return [
    { to: paths.myTeamHome(teamId), label: 'Início' },
    { to: paths.myTeam(teamId), label: 'Elenco', end: true },
    { to: paths.myTeamGames(teamId), label: 'Jogos' },
    { to: paths.myTeamHighlights(teamId), label: 'Destaques' },
    { to: paths.myTeamStandings(teamId), label: 'Tabela' },
    { to: paths.myTeamBracket(teamId), label: 'Playoffs' },
  ];
}

// Dono com um só time cai direto no início dele; com vários, escolhe na lista.
function OwnerHomeRedirect({ userId }: { userId: string }) {
  const { teams, isLoading } = useMyTeams(userId);
  if (isLoading) return <LoaderGlobal label="Carregando seus times" />;
  return <Navigate to={teams.length === 1 ? paths.myTeamHome(teams[0].id) : ROUTES.myTeams} replace />;
}

// Coordenador com uma só liga cai direto na Configuração dela; com várias, escolhe na lista.
function CoordinatorHomeRedirect() {
  const { competitions, isLoading } = useCompetitions();
  if (isLoading) return <LoaderGlobal label="Carregando sua liga" />;
  return (
    <Navigate to={competitions.length === 1 ? paths.competitionSettings(competitions[0].id) : ROUTES.competitions} replace />
  );
}

// /painel abre direto no que cada papel usa: competições (Admin), a liga (coordenador) ou o time (equipe).
function PanelHomeRedirect() {
  const { profile } = useAuth();
  if (profile?.papel === 'dono_time') return <OwnerHomeRedirect userId={profile.id} />;
  if (profile?.papel === 'admin') return <CoordinatorHomeRedirect />;
  return <Navigate to={ROUTES.competitions} replace />;
}

function PanelLayoutRoute() {
  const { profile, signOut } = useAuth();
  const navigate = useAppNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const match = useMatch(`${ROUTE_PATTERNS.competition}/*`);
  const competitionId = match?.params.competitionId;
  const openCompetitionId = competitionId && competitionId !== 'nova' ? competitionId : undefined;
  const teamMatch = useMatch(`${ROUTE_PATTERNS.myTeam}/*`);
  const openTeamId = teamMatch?.params.teamId;
  const { team } = useTeamSummary(openTeamId);

  if (!profile) return null;

  // Dentro de uma competição, o menu mostra só as opções dela e um "Voltar"; logo e nome ficam no banner da liga.
  const inCompetition = Boolean(openCompetitionId) && profile.papel !== 'dono_time';
  const inTeam = Boolean(openTeamId) && profile.papel === 'dono_time';
  const generalItems = inCompetition
    ? []
    : NAV_ITEMS.filter((item) => item.roles.includes(profile.papel) && !(inTeam && item.to === ROUTES.myTeams));
  const sections: IPanelNavSection[] = [
    ...(openCompetitionId && inCompetition
      ? [
          {
            key: 'competicao',
            back: { to: ROUTES.competitions, label: 'Voltar' },
            items: competitionNavItems(openCompetitionId, profile.papel),
          },
        ]
      : []),
    ...(openTeamId && inTeam
      ? [
          {
            key: 'time',
            title: team ? `${team.nome} · ${team.competicao.nome}` : 'Meu time',
            back: { to: ROUTES.myTeams, label: 'Meus times' },
            items: myTeamNavItems(openTeamId),
          },
        ]
      : []),
    ...(generalItems.length > 0 ? [{ key: 'geral', items: generalItems }] : []),
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      navigate(ROUTES.login, { replace: true });
    }
  };

  return (
    <PanelLayoutGlobal
      userName={profile.nome}
      roleLabel={PAPEL_LABEL[profile.papel]}
      sections={sections}
      onSignOut={handleSignOut}
      signingOut={signingOut}
    >
      <Suspense fallback={<LoaderGlobal label="Carregando" />}>
        <Outlet />
      </Suspense>
    </PanelLayoutGlobal>
  );
}

// Ao abrir a competição: o coordenador sempre cai na configuração; o Admin, na configuração
// enquanto é rascunho e nos jogos depois de iniciada.
function CompetitionHomeRedirect() {
  const { competitionId } = useRouteParams('competitionId');
  const { profile } = useAuth();
  const { competition, isLoading, error, refetch } = useCompetition(competitionId);
  if (isLoading) return <LoaderGlobal label="Carregando competição" />;
  if (error || !competition) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
  return (
    <Navigate
      to={
        competition.status === 'rascunho' || profile?.papel === 'admin'
          ? paths.competitionSettings(competitionId)
          : paths.competitionGames(competitionId)
      }
      replace
    />
  );
}


// Páginas de uma liga: banner com logo e nome no topo e, com ela desativada, o aviso com o botão de reativar.
function CompetitionLayoutRoute() {
  const { competitionId } = useRouteParams('competitionId');
  const { competition, setActive } = useCompetition(competitionId);
  const confirmAction = useConfirmAction();
  useRealtimeCompetitionGames(competitionId);
  return (
    <>
      {competition && (
        <LeagueHeaderGlobal
          name={competition.nome}
          logoUrl={competition.logo_url}
          tags={[
            MODALIDADE_LABEL[competition.modalidade],
            competition.ativa ? STATUS_COMPETICAO[competition.status].label : 'Desativada',
          ]}
        />
      )}
      {competition && !competition.ativa && (
        <InactiveLeagueNoticeGlobal
          loading={setActive.isPending}
          error={setActive.error ? getErrorMessage(setActive.error) : null}
          onReactivate={() =>
            confirmAction('Reativar a liga? Ela volta a aparecer para o público e para as equipes.', () =>
              setActive.mutate(true),
            )
          }
        />
      )}
      <Outlet />
    </>
  );
}

const ADMIN_ROLES: Papel[] = ['master', 'admin'];

export const appStack: RouteObject = {
  element: <RequireAuth />,
  children: [
    // Súmula em papel: página inteira, sem o menu do painel, para imprimir.
    {
      path: ROUTE_PATTERNS.gamePrintSheet,
      element: (
        <RequireRole roles={ADMIN_ROLES}>
          <PrintScoreSheetScreen />
        </RequireRole>
      ),
    },
    // Súmula ao vivo: tela inteira para o mesário (celular, tablet ou computador).
    {
      path: ROUTE_PATTERNS.gameLiveSheet,
      element: (
        <RequireRole roles={ADMIN_ROLES}>
          <LiveScoreSheetScreen />
        </RequireRole>
      ),
    },
    {
      path: ROUTES.panel,
      element: <PanelLayoutRoute />,
      children: [
        { index: true, element: <PanelHomeRedirect /> },
        {
          path: ROUTES.users,
          element: (
            <RequireRole roles={ADMIN_ROLES}>
              <UsersScreen />
            </RequireRole>
          ),
        },
        {
          element: <RequireRole roles={ADMIN_ROLES} />,
          children: [
            { path: ROUTES.competitions, element: <CompetitionsScreen /> },
            {
              path: ROUTES.newCompetition,
              element: (
                <RequireRole roles={['master']}>
                  <CompetitionWizardScreen />
                </RequireRole>
              ),
            },
            {
              path: ROUTE_PATTERNS.competition,
              element: <CompetitionLayoutRoute />,
              children: [
                { index: true, element: <CompetitionHomeRedirect /> },
                { path: ROUTE_PATTERNS.competitionSettings, element: <CompetitionWizardScreen /> },
                { path: ROUTE_PATTERNS.competitionTeams, element: <TeamsScreen /> },
                { path: ROUTE_PATTERNS.competitionTeam, element: <TeamDetailScreen /> },
                // Etapa 3
                { path: ROUTE_PATTERNS.competitionEvents, element: <EventsScreen /> },
                // Etapa 4
                { path: ROUTE_PATTERNS.competitionGames, element: <GamesScreen /> },
                { path: ROUTE_PATTERNS.gameScoreSheet, element: <ScoreSheetScreen /> },
                // Etapa 7
                { path: ROUTE_PATTERNS.competitionFinance, element: <FinanceScreen /> },
                { path: ROUTE_PATTERNS.competitionHighlights, element: <CompetitionHighlightsScreen /> },
                { path: ROUTE_PATTERNS.competitionStandings, element: <CompetitionStandingsScreen /> },
                { path: ROUTE_PATTERNS.competitionBracket, element: <CompetitionBracketScreen /> },
                {
                  path: ROUTE_PATTERNS.competitionAdmins,
                  element: (
                    <RequireRole roles={['master']}>
                      <CompetitionAdminsScreen />
                    </RequireRole>
                  ),
                },
              ],
            },
          ],
        },
        {
          element: <RequireRole roles={['dono_time']} />,
          children: [
            { path: ROUTES.myTeams, element: <MyTeamsScreen /> },
            { path: ROUTE_PATTERNS.myTeam, element: <MyTeamDetailScreen /> },
            { path: ROUTE_PATTERNS.myTeamHome, element: <MyTeamLeagueScreen view="inicio" /> },
            { path: ROUTE_PATTERNS.myTeamGames, element: <MyTeamLeagueScreen view="jogos" /> },
            { path: ROUTE_PATTERNS.myTeamHighlights, element: <MyTeamLeagueScreen view="destaques" /> },
            { path: ROUTE_PATTERNS.myTeamStandings, element: <MyTeamLeagueScreen view="tabela" /> },
            { path: ROUTE_PATTERNS.myTeamBracket, element: <MyTeamLeagueScreen view="playoffs" /> },
          ],
        },
      ],
    },
  ],
};
