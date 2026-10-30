import { AlertGlobal } from '@/components/alertGlobal';
import { BoxScoreGlobal } from '@/components/boxScoreGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { ScoreboardGlobal } from '@/components/scoreboardGlobal';
import { usePublicGame } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { describeGame, gameStatus, hasResult } from '@/utils/games';
import { sortByNumber } from '@/utils/scoreSheet';
import { Info, Stack, Teams } from './style';

// Detalhe do jogo: placar, data/local e box score (seção 9.1).
export function PublicGameScreen() {
  const { slug, gameId } = useRouteParams('slug', 'gameId');
  const { detalhe, isLoading, error, refetch } = usePublicGame(gameId);

  if (isLoading) return <LoaderGlobal label="Carregando jogo" />;
  if (error || !detalhe) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  const { jogo, categorias, jogadores, presentes, estatisticas } = detalhe;
  const casa = jogo.casa?.nome ?? 'A definir';
  const fora = jogo.fora?.nome ?? 'A definir';
  const temBoxScore = jogo.status === 'encerrado' && !jogo.so_placar && presentes.length > 0;
  const presentesDo = (timeId: string) =>
    sortByNumber(jogadores.filter((j) => j.time_id === timeId && presentes.includes(j.id)));

  return (
    <Stack>
      <ScoreboardGlobal
        home={casa}
        away={fora}
        homeScore={jogo.placar_casa?.toString() ?? '–'}
        awayScore={jogo.placar_fora?.toString() ?? '–'}
        subtitle={gameStatus(jogo.status).label}
      />
      <Info>{describeGame(jogo)}</Info>
      {jogo.status === 'wo' && <AlertGlobal variant="info" message="Jogo decidido por W.O." />}
      {jogo.status === 'encerrado' && jogo.so_placar && (
        <AlertGlobal variant="info" message="Só o placar foi lançado neste jogo; não há estatísticas por jogador." />
      )}
      {!hasResult(jogo) && <AlertGlobal variant="info" message="O placar aparece aqui assim que o jogo terminar." />}
      {temBoxScore && (
        <Teams>
          <BoxScoreGlobal
            teamName={casa}
            score={jogo.placar_casa}
            players={presentesDo(jogo.time_casa_id)}
            categories={categorias}
            stats={estatisticas}
          />
          <BoxScoreGlobal
            teamName={fora}
            score={jogo.placar_fora}
            players={presentesDo(jogo.time_fora_id)}
            categories={categorias}
            stats={estatisticas}
          />
        </Teams>
      )}
      <LinkButtonGlobal to={paths.publicGames(slug)} label="← Todos os jogos" variant="ghost" size="sm" />
    </Stack>
  );
}
