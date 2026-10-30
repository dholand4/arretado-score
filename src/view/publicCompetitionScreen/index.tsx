import type { IJogoLista } from '@/@types/game';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { GameCardGlobal } from '@/components/gameCardGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { RankingTableGlobal } from '@/components/rankingTableGlobal';
import { usePublicCompetition, usePublicGames, useRanking } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { describeGame, gameStatus } from '@/utils/games';
import { latestResults, sortRanking, upcomingGames } from '@/utils/publicView';
import { List, Muted, Section, SectionTitle, Shortcuts, Stack } from './style';

function GameList({ slug, jogos, empty }: { slug: string; jogos: IJogoLista[]; empty: string }) {
  if (jogos.length === 0) return <Muted>{empty}</Muted>;
  return (
    <List>
      {jogos.map((jogo) => {
        const status = gameStatus(jogo.status);
        return (
          <li key={jogo.id}>
            <GameCardGlobal
              to={paths.publicGame(slug, jogo.id)}
              home={jogo.casa?.nome ?? 'A definir'}
              away={jogo.fora?.nome ?? 'A definir'}
              homeScore={jogo.placar_casa}
              awayScore={jogo.placar_fora}
              statusLabel={status.label}
              statusTone={status.tone}
              description={describeGame(jogo)}
              actionLabel="Ver jogo"
            />
          </li>
        );
      })}
    </List>
  );
}

// Início da competição (seção 9.1): próximos jogos, últimos resultados e top 3 dos rankings.
export function PublicCompetitionScreen() {
  const { slug } = useRouteParams('slug');
  const { competicao } = usePublicCompetition(slug);
  const { jogos, isLoading, error, refetch } = usePublicGames(competicao?.id);
  const { ranking } = useRanking(competicao?.id, null);

  if (isLoading) return <LoaderGlobal label="Carregando competição" />;
  if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  return (
    <Stack>
      {competicao?.descricao && <Muted>{competicao.descricao}</Muted>}
      <Shortcuts>
        <LinkButtonGlobal to={paths.publicStandings(slug)} label="Tabela" variant="primary" size="sm" />
        <LinkButtonGlobal to={paths.publicPlayoffs(slug)} label="Playoffs" size="sm" />
        <LinkButtonGlobal to={paths.publicGames(slug)} label="Todos os jogos" size="sm" />
      </Shortcuts>
      <Section>
        <SectionTitle>Próximos jogos</SectionTitle>
        <GameList slug={slug} jogos={upcomingGames(jogos)} empty="Nenhum jogo marcado nos próximos dias." />
      </Section>
      <Section>
        <SectionTitle>Últimos resultados</SectionTitle>
        <GameList slug={slug} jogos={latestResults(jogos)} empty="Ainda não há resultados." />
      </Section>
      <Section>
        <SectionTitle>Destaques</SectionTitle>
        {!ranking || ranking.linhas.length === 0 ? (
          <EmptyStateGlobal title="Rankings aparecem depois das primeiras súmulas" />
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
          <LinkButtonGlobal to={paths.publicRankings(slug)} label="Ver todos os rankings" size="sm" variant="ghost" />
        </Shortcuts>
      </Section>
    </Stack>
  );
}
