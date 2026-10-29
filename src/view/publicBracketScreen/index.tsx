import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { usePublicBracket } from '@/hooks/usePublicBracket';
import { useRouteParams } from '@/hooks/useRouteParams';
import { Bracket, Champion, Games, Phase, Series, Team } from './style';

export function PublicBracketScreen() {
  const { slug } = useRouteParams('slug');
  const { data, phases, champion, isPending, error, refetch } = usePublicBracket(slug);
  return (
    <>
      <PageHeaderGlobal title="Playoffs" subtitle={data?.competition.nome} />
      {isPending ? (
        <LoaderGlobal label="Carregando playoffs" />
      ) : error ? (
        <ErrorStateGlobal error={error} onRetry={() => void refetch()} />
      ) : phases.length === 0 ? (
        <EmptyStateGlobal title="Ainda não há playoffs" />
      ) : (
        <>
          {champion && <Champion>Campeão: {champion}</Champion>}
          <Bracket aria-label="Chaveamento dos playoffs">
            {phases.map((phase) => (
              <Phase key={phase.id}>
                <h2>{phase.nome}</h2>
                {phase.series.length === 0 && <p>Confrontos ainda não definidos.</p>}
                {phase.series.map((series) => (
                  <Series key={series.id}>
                    <strong>{series.codigo} · Melhor de {series.melhor_de}</strong>
                    <Team><span>{series.nameA}</span><strong>{series.vitorias_a}</strong></Team>
                    <Team><span>{series.nameB}</span><strong>{series.vitorias_b}</strong></Team>
                    {series.games.length > 0 && (
                      <Games>
                        {series.games.map((game) => (
                          <li key={game.id}>
                            Jogo {game.numero_na_serie}: {game.home} {game.placar_casa ?? '–'} × {game.placar_fora ?? '–'} {game.away}
                          </li>
                        ))}
                      </Games>
                    )}
                  </Series>
                ))}
              </Phase>
            ))}
          </Bracket>
        </>
      )}
    </>
  );
}
