import { Suspense } from 'react';
import { Outlet, type RouteObject } from 'react-router-dom';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { EntityHeaderGlobal } from '@/components/entityHeaderGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PublicLayoutGlobal } from '@/components/publicLayoutGlobal';
import { ShareButtonGlobal } from '@/components/shareButtonGlobal';
import { SubNavGlobal } from '@/components/subNavGlobal';
import { MODALIDADE_LABEL, STATUS_COMPETICAO } from '@/constants/competition';
import { useAuth } from '@/hooks/useAuth';
import { usePublicCompetition, useRealtimeCompetition } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths, ROUTE_PATTERNS, ROUTES } from './types';
import {
  HomeScreen,
  PublicBracketScreen,
  PublicCompetitionScreen,
  PublicGameScreen,
  PublicGamesScreen,
  PublicPlayerScreen,
  PublicRankingsScreen,
  PublicStandingsScreen,
  PublicTeamScreen,
  PublicTeamsScreen,
} from './screens';

function PublicLayoutRoute() {
  const { status } = useAuth();
  const accountLink =
    status === 'signedIn' ? { to: ROUTES.panel, label: 'Painel' } : { to: ROUTES.login, label: 'Entrar' };
  return (
    <PublicLayoutGlobal accountLink={accountLink}>
      <Suspense fallback={<LoaderGlobal label="Carregando" />}>
        <Outlet />
      </Suspense>
    </PublicLayoutGlobal>
  );
}

// Cabeçalho e abas comuns às páginas de uma competição, com atualização ao vivo.
function PublicCompetitionLayoutRoute() {
  const { slug } = useRouteParams('slug');
  const { competicao, isLoading, error, refetch } = usePublicCompetition(slug);
  useRealtimeCompetition(competicao?.id, slug);

  if (isLoading) return <LoaderGlobal label="Carregando competição" />;
  if (error || !competicao) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  const status = STATUS_COMPETICAO[competicao.status];
  return (
    <>
      <EntityHeaderGlobal
        title={competicao.nome}
        subtitle={MODALIDADE_LABEL[competicao.modalidade]}
        imageUrl={competicao.logo_url}
        badges={<BadgeGlobal label={status.label} tone={status.tone} />}
        actions={
          <ShareButtonGlobal
            title={competicao.nome}
            text={`${competicao.nome}: tabela, jogos e playoffs no Arretado Score.`}
          />
        }
      />
      <SubNavGlobal
        ariaLabel="Seções da competição"
        items={[
          { to: paths.publicCompetition(slug), label: 'Início', end: true },
          { to: paths.publicGames(slug), label: 'Jogos' },
          { to: paths.publicStandings(slug), label: 'Tabela' },
          { to: paths.publicPlayoffs(slug), label: 'Playoffs' },
          { to: paths.publicRankings(slug), label: 'Rankings' },
          { to: paths.publicTeams(slug), label: 'Times' },
        ]}
      />
      <Outlet />
    </>
  );
}

export const publicStack: RouteObject = {
  element: <PublicLayoutRoute />,
  children: [
    { path: ROUTES.home, element: <HomeScreen /> },
    {
      path: ROUTE_PATTERNS.publicCompetition,
      element: <PublicCompetitionLayoutRoute />,
      children: [
        { index: true, element: <PublicCompetitionScreen /> },
        { path: ROUTE_PATTERNS.publicGames, element: <PublicGamesScreen /> },
        { path: ROUTE_PATTERNS.publicGame, element: <PublicGameScreen /> },
        { path: ROUTE_PATTERNS.publicStandings, element: <PublicStandingsScreen /> },
        { path: ROUTE_PATTERNS.publicPlayoffs, element: <PublicBracketScreen /> },
        { path: ROUTE_PATTERNS.publicRankings, element: <PublicRankingsScreen /> },
        { path: ROUTE_PATTERNS.publicTeams, element: <PublicTeamsScreen /> },
        { path: ROUTE_PATTERNS.publicTeam, element: <PublicTeamScreen /> },
        { path: ROUTE_PATTERNS.publicPlayer, element: <PublicPlayerScreen /> },
      ],
    },
  ],
};
