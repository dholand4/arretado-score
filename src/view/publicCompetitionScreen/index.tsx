import type { IJogoLista } from '@/@types/game';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { FormatOverviewGlobal } from '@/components/formatOverviewGlobal';
import { GameCardGlobal } from '@/components/gameCardGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { RankingTableGlobal } from '@/components/rankingTableGlobal';
import { usePublicCompetition, usePublicFormat, usePublicGames, useRanking } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths, type RoutePath } from '@/routes/types';
import { dayContext, type IDayContext } from '@/utils/eventSchedule';
import { gameCardTexts, gameStatus } from '@/utils/games';
import { latestResults, sortRanking, upcomingGames } from '@/utils/publicView';
import { Empty, List, Muted, Rankings, Section, SectionHeader, SectionTitle, Stack } from './style';

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
  if (jogos.length === 0) return <Empty>{empty}</Empty>;
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
            />
          </li>
        );
      })}
    </List>
  );
}

// Título da seção com o atalho "Ver todos" (as abas acima já levam às páginas completas).
function Header({ title, to }: { title: string; to?: RoutePath }) {
  return (
    <SectionHeader>
      <SectionTitle>{title}</SectionTitle>
      {to && <LinkButtonGlobal to={to} label="Ver todos →" size="sm" variant="ghost" />}
    </SectionHeader>
  );
}

// Início da competição (seção 9.1): próximos jogos, últimos resultados, top 3 dos rankings e formato.
export function PublicCompetitionScreen() {
  const { slug } = useRouteParams('slug');
  const { competicao } = usePublicCompetition(slug);
  const { jogos, isLoading, error, refetch } = usePublicGames(competicao?.id);
  const { ranking } = useRanking(competicao?.id, null);
  const { fases, resumo } = usePublicFormat(competicao?.id);

  if (isLoading) return <LoaderGlobal label="Carregando competição" />;
  if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  // Confrontos que dependem do resultado anterior do dia, calculados com todos os jogos.
  const contexto = dayContext(jogos);
  const proximos = upcomingGames(jogos);
  const resultados = latestResults(jogos);
  const temRanking = Boolean(ranking && ranking.linhas.length > 0);

  return (
    <Stack>
      {competicao?.descricao && <Muted>{competicao.descricao}</Muted>}
      <Section>
        <Header title="Próximos jogos" to={proximos.length > 0 ? paths.publicGames(slug) : undefined} />
        <GameList slug={slug} contexto={contexto} jogos={proximos} empty="Nenhum jogo marcado nos próximos dias." />
      </Section>
      <Section>
        <Header title="Últimos resultados" to={resultados.length > 0 ? paths.publicGames(slug) : undefined} />
        <GameList slug={slug} contexto={contexto} jogos={resultados} empty="Ainda não há resultados." />
      </Section>
      <Section>
        <Header title="Destaques" to={temRanking ? paths.publicRankings(slug) : undefined} />
        {!ranking || !temRanking ? (
          <Empty>Os rankings aparecem depois das primeiras súmulas.</Empty>
        ) : (
          <Rankings>
            {ranking.categorias.map((categoria) => (
              <RankingTableGlobal
                key={categoria.id}
                caption={categoria.titulo_ranking}
                rows={sortRanking(ranking.linhas.filter((l) => l.categoria_id === categoria.id), 'total')}
                limit={3}
              />
            ))}
          </Rankings>
        )}
      </Section>
      {fases.length > 0 && (
        <Section>
          <Header title="Formato" />
          <FormatOverviewGlobal fases={fases} resumo={resumo} />
        </Section>
      )}
    </Stack>
  );
}
