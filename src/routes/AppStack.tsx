import { useState } from 'react';
import { Outlet, type RouteObject } from 'react-router-dom';
import type { Papel } from '@/@types/user';
import { PanelLayoutGlobal, type IPanelNavItem } from '@/components/panelLayoutGlobal';
import { SubNavGlobal } from '@/components/subNavGlobal';
import { PAPEL_LABEL } from '@/constants/roles';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useAuth } from '@/hooks/useAuth';
import { useRouteParams } from '@/hooks/useRouteParams';
import { CompetitionAdminsScreen } from '@/view/competitionAdminsScreen';
import { CompetitionOverviewScreen } from '@/view/competitionOverviewScreen';
import { CompetitionsScreen } from '@/view/competitionsScreen';
import { CompetitionWizardScreen } from '@/view/competitionWizardScreen';
import { EventsScreen } from '@/view/eventsScreen';
import { GamesScreen } from '@/view/gamesScreen';
import { MyTeamDetailScreen } from '@/view/myTeamDetailScreen';
import { MyTeamsScreen } from '@/view/myTeamsScreen';
import { PanelScreen } from '@/view/panelScreen';
import { ScoreSheetScreen } from '@/view/scoreSheetScreen';
import { TeamDetailScreen } from '@/view/teamDetailScreen';
import { TeamsScreen } from '@/view/teamsScreen';
import { UsersScreen } from '@/view/usersScreen';
import { RequireAuth, RequireRole } from './guards';
import { paths, ROUTE_PATTERNS, ROUTES } from './types';

const NAV_ITEMS: (IPanelNavItem & { roles: Papel[] })[] = [
  { to: ROUTES.panel, label: 'Início', end: true, roles: ['master', 'admin', 'dono_time'] },
  { to: ROUTES.competitions, label: 'Competições', roles: ['master', 'admin'] },
  { to: ROUTES.myTeams, label: 'Meus times', roles: ['dono_time'] },
  { to: ROUTES.users, label: 'Usuários', roles: ['master'] },
  { to: ROUTES.changePassword, label: 'Trocar senha', roles: ['master', 'admin', 'dono_time'] },
];

function PanelLayoutRoute() {
  const { profile, signOut } = useAuth();
  const navigate = useAppNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!profile) return null;

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
      navItems={NAV_ITEMS.filter((item) => item.roles.includes(profile.papel))}
      onSignOut={handleSignOut}
      signingOut={signingOut}
    >
      <Outlet />
    </PanelLayoutGlobal>
  );
}

// Abas das páginas de uma competição (a RLS garante que só admins dela chegam aos dados).
function CompetitionLayoutRoute() {
  const { competitionId } = useRouteParams('competitionId');
  const { profile } = useAuth();
  const items = [
    { to: paths.competition(competitionId), label: 'Visão geral', end: true },
    { to: paths.competitionSettings(competitionId), label: 'Configuração' },
    { to: paths.competitionTeams(competitionId), label: 'Times' },
    { to: paths.competitionEvents(competitionId), label: 'Dias de jogos' },
    { to: paths.competitionGames(competitionId), label: 'Jogos' },
    ...(profile?.papel === 'master' ? [{ to: paths.competitionAdmins(competitionId), label: 'Admins' }] : []),
  ];
  return (
    <>
      <SubNavGlobal ariaLabel="Seções da competição" items={items} />
      <Outlet />
    </>
  );
}

const ADMIN_ROLES: Papel[] = ['master', 'admin'];

export const appStack: RouteObject = {
  element: <RequireAuth />,
  children: [
    {
      path: ROUTES.panel,
      element: <PanelLayoutRoute />,
      children: [
        { index: true, element: <PanelScreen /> },
        {
          path: ROUTES.users,
          element: (
            <RequireRole roles={['master']}>
              <UsersScreen />
            </RequireRole>
          ),
        },
        {
          element: <RequireRole roles={ADMIN_ROLES} />,
          children: [
            { path: ROUTES.competitions, element: <CompetitionsScreen /> },
            { path: ROUTES.newCompetition, element: <CompetitionWizardScreen /> },
            {
              path: ROUTE_PATTERNS.competition,
              element: <CompetitionLayoutRoute />,
              children: [
                { index: true, element: <CompetitionOverviewScreen /> },
                { path: ROUTE_PATTERNS.competitionSettings, element: <CompetitionWizardScreen /> },
                { path: ROUTE_PATTERNS.competitionTeams, element: <TeamsScreen /> },
                { path: ROUTE_PATTERNS.competitionTeam, element: <TeamDetailScreen /> },
                // Etapa 3
                { path: ROUTE_PATTERNS.competitionEvents, element: <EventsScreen /> },
                // Etapa 4
                { path: ROUTE_PATTERNS.competitionGames, element: <GamesScreen /> },
                { path: ROUTE_PATTERNS.gameScoreSheet, element: <ScoreSheetScreen /> },
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
          ],
        },
      ],
    },
  ],
};
