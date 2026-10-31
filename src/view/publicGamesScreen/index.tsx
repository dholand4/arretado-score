import { useMemo, useState } from 'react';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { GameCardGlobal } from '@/components/gameCardGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { usePublicCompetition, usePublicGames } from '@/hooks/usePublic';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { dependentGames, gameSides } from '@/utils/eventSchedule';
import { describeGame, filterGames, gameStatus } from '@/utils/games';
import { groupGamesByDay, latestFirst } from '@/utils/publicView';
import { Day, DayTitle, Filters, List } from './style';

interface IGamesContentProps {
  slug: string;
  competicaoId: string | undefined;
  initialTimeId?: string;
}

// Jogos agrupados por dia, com placar quando encerrados (seção 9.1); usado também pelo dono do time.
export function GamesContent({ slug, competicaoId, initialTimeId = '' }: IGamesContentProps) {
  const { jogos, isLoading, error, refetch } = usePublicGames(competicaoId);
  const [faseId, setFaseId] = useState('');
  const [timeId, setTimeId] = useState(initialTimeId);

  const fases = useMemo(
    () => [...new Map(jogos.map((j) => [j.fase_id, j.fase?.nome ?? 'Fase'])).entries()],
    [jogos],
  );
  const times = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const j of jogos) {
      if (j.casa) mapa.set(j.time_casa_id, j.casa.nome);
      if (j.fora) mapa.set(j.time_fora_id, j.fora.nome);
    }
    return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [jogos]);

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando jogos" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    const dependentes = dependentGames(jogos);
    // O último jogo que aconteceu aparece primeiro.
    const dias = groupGamesByDay(latestFirst(filterGames(jogos, { faseId, timeId, status: '' })));
    if (dias.length === 0) return <EmptyStateGlobal title="Nenhum jogo publicado ainda" />;
    return dias.map((dia) => (
      <Day key={dia.dia}>
        <DayTitle>{dia.dia}</DayTitle>
        <List>
          {dia.jogos.map((jogo) => {
            const status = gameStatus(jogo.status);
            return (
              <li key={jogo.id}>
                <GameCardGlobal
                  to={paths.publicGame(slug, jogo.id)}
                  {...gameSides(jogo, dependentes)}
                  homeScore={jogo.placar_casa}
                  awayScore={jogo.placar_fora}
                  statusLabel={status.label}
                  statusTone={status.tone}
                  description={describeGame(jogo, dependentes.has(jogo.id))}
                  actionLabel="Ver jogo"
                />
              </li>
            );
          })}
        </List>
      </Day>
    ));
  };

  return (
    <>
      <Filters>
        <SelectGlobal
          label="Fase"
          value={faseId}
          options={[{ value: '', label: 'Todas' }, ...fases.map(([id, nome]) => ({ value: id, label: nome }))]}
          onChange={(event) => setFaseId(event.target.value)}
        />
        <SelectGlobal
          label="Time"
          value={timeId}
          options={[{ value: '', label: 'Todos' }, ...times.map(([id, nome]) => ({ value: id, label: nome }))]}
          onChange={(event) => setTimeId(event.target.value)}
        />
      </Filters>
      {renderContent()}
    </>
  );
}

export function PublicGamesScreen() {
  const { slug } = useRouteParams('slug');
  const { competicao } = usePublicCompetition(slug);
  return (
    <>
      <PageHeaderGlobal title="Jogos" />
      <GamesContent slug={slug} competicaoId={competicao?.id} />
    </>
  );
}
