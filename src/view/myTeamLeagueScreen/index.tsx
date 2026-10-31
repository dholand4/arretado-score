import type { ITimeDetalhe } from '@/@types/competition';
import type { IJogoLista } from '@/@types/game';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { GameCardGlobal } from '@/components/gameCardGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { RankingTableGlobal } from '@/components/rankingTableGlobal';
import { usePublicGames, useRanking, useRealtimeCompetition } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useTeam } from '@/hooks/useTeams';
import { paths } from '@/routes/types';
import { dayContext, type IDayContext } from '@/utils/eventSchedule';
import { gameCardTexts, gameStatus } from '@/utils/games';
import { latestResults, sortRanking, upcomingGames } from '@/utils/publicView';
import { BracketContent } from '@/view/publicBracketScreen';
import { GamesContent } from '@/view/publicGamesScreen';
import { RankingsContent } from '@/view/publicRankingsScreen';
import { StandingsContent } from '@/view/publicStandingsScreen';
import { List, Muted, Section, SectionTitle, Shortcuts, Stack } from './style';

export type MyTeamLeagueView = 'inicio' | 'jogos' | 'tabela' | 'destaques' | 'playoffs';

const TITLES: Record<MyTeamLeagueView, string> = {
  inicio: 'Início',
  jogos: 'Jogos',
  tabela: 'Tabela',
  destaques: 'Destaques',
  playoffs: 'Playoffs',
};

const playsIn = (timeId: string) => (jogo: IJogoLista) => jogo.time_casa_id === timeId || jogo.time_fora_id === timeId;

function GameList({
  slug,
  jogos,
  empty,
  contexto,
}: {
  slug: string;
  jogos: IJogoLista[];
  empty: string;
  contexto: IDayContext;
}) {
  if (jogos.length === 0) return <Muted>{empty}</Muted>;
  return (
    <List>
      {jogos.map((jogo) => {
        const status = gameStatus(jogo.status);
        return (
          <li key={jogo.id}>
            <GameCardGlobal
              to={paths.publicGame(slug, jogo.id)}
              {...gameCardTexts(jogo, contexto)}
              homeScore={jogo.placar_casa}
              awayScore={jogo.placar_fora}
              statusLabel={status.label}
              statusTone={status.tone}
              actionLabel="Ver jogo"
            />
          </li>
        );
      })}
    </List>
  );
}

// Resumo da liga do ponto de vista do time: próximo jogo dele, próximo da liga, resultados e destaques.
function TeamHome({ team }: { team: ITimeDetalhe }) {
  const { slug, id: competicaoId } = team.competicao;
  const { jogos, isLoading, error, refetch } = usePublicGames(competicaoId);
  const { ranking } = useRanking(competicaoId, null);

  if (isLoading) return <LoaderGlobal label="Carregando jogos" />;
  if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
  // Confrontos que dependem do resultado anterior do dia, calculados com todos os jogos.
  const contexto = dayContext(jogos);

  const proximos = upcomingGames(jogos, new Date(), jogos.length);
  const proximoDoTime = proximos.find(playsIn(team.id));
  const proximoDaLiga = proximos[0];

  return (
    <Stack>
      <Section>
        <SectionTitle>Próximo jogo do {team.nome}</SectionTitle>
        <GameList slug={slug} contexto={contexto} jogos={proximoDoTime ? [proximoDoTime] : []} empty="Nenhum jogo do time marcado ainda." />
      </Section>
      <Section>
        <SectionTitle>Próximo jogo da liga</SectionTitle>
        <GameList slug={slug} contexto={contexto} jogos={proximoDaLiga ? [proximoDaLiga] : []} empty="Nenhum jogo marcado nos próximos dias." />
      </Section>
      <Section>
        <SectionTitle>Últimos resultados do {team.nome}</SectionTitle>
        <GameList slug={slug} contexto={contexto} jogos={latestResults(jogos.filter(playsIn(team.id)), 4)} empty="O time ainda não jogou." />
      </Section>
      <Section>
        <SectionTitle>Destaques</SectionTitle>
        {!ranking || ranking.linhas.length === 0 ? (
          <EmptyStateGlobal title="Os destaques aparecem depois das primeiras súmulas" />
        ) : (
          ranking.categorias.map((categoria) => (
            <RankingTableGlobal
              key={categoria.id}
              caption={categoria.titulo_ranking}
              rows={sortRanking(ranking.linhas.filter((l) => l.categoria_id === categoria.id), 'total')}
              limit={3}
            />
          ))
        )}
        <Shortcuts>
          <LinkButtonGlobal to={paths.myTeamHighlights(team.id)} label="Ver todos os destaques" size="sm" variant="ghost" />
        </Shortcuts>
      </Section>
    </Stack>
  );
}

// Área da liga para o dono do time: as mesmas informações da área pública, dentro do painel.
export function MyTeamLeagueScreen({ view }: { view: MyTeamLeagueView }) {
  const { teamId } = useRouteParams('teamId');
  const { team, isLoading, error, refetch } = useTeam(teamId);
  useRealtimeCompetition(team?.competicao.id, team?.competicao.slug ?? '');

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando time" />;
    if (error || !team) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    const { slug, id: competicaoId } = team.competicao;
    switch (view) {
      case 'inicio':
        return <TeamHome team={team} />;
      case 'jogos':
        return <GamesContent slug={slug} competicaoId={competicaoId} initialTimeId={team.id} />;
      case 'tabela':
        return <StandingsContent slug={slug} />;
      case 'destaques':
        return <RankingsContent competicaoId={competicaoId} />;
      case 'playoffs':
        return <BracketContent slug={slug} />;
    }
  };

  return (
    <>
      <PageHeaderGlobal title={TITLES[view]} subtitle={team?.competicao.nome} />
      {renderContent()}
    </>
  );
}
