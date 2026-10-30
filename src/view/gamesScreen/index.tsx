import { useState } from 'react';
import type { StatusJogo } from '@/@types/event';
import type { IJogosContexto } from '@/@types/game';
import { CardGlobal } from '@/components/cardGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { GameCardGlobal } from '@/components/gameCardGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { StandingsAdjustGlobal } from '@/components/standingsAdjustGlobal';
import { STATUS_JOGO } from '@/constants/phase';
import { useAdjustClassification, useClassification } from '@/hooks/useClassification';
import { useGames } from '@/hooks/useGames';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { describeGame, filterGames, gameStatus, hasResult, type IGameFilters } from '@/utils/games';
import { pluralize } from '@/utils/text';
import { Adjustments, Count, Filters, List } from './style';

type Fase = IJogosContexto['fases'][number];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  ...(Object.keys(STATUS_JOGO) as StatusJogo[]).map((status) => ({ value: status, label: STATUS_JOGO[status] })),
];

function TieAdjust({ fase, grupoId, title }: { fase: Fase; grupoId: string | null; title: string }) {
  const { linhas, isLoading, error } = useClassification(fase, grupoId);
  const adjust = useAdjustClassification(fase.id, grupoId);
  if (isLoading || error) return null;
  return (
    <CardGlobal title={title}>
      <StandingsAdjustGlobal
        tiedRows={linhas.filter((linha) => linha.empate_tecnico && linha.j > 0)}
        busy={adjust.isPending}
        error={adjust.error ? getErrorMessage(adjust.error) : null}
        onSave={(timeId, prioridade) => adjust.mutate({ timeId, prioridade })}
        onRemove={(timeId) => adjust.mutate({ timeId, prioridade: null })}
      />
    </CardGlobal>
  );
}

export function GamesScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const { jogos, fases, times, grupos, isLoading, error, refetch } = useGames(competitionId);
  const [filters, setFilters] = useState<IGameFilters>({ faseId: '', timeId: '', status: '' });

  const setFilter = <K extends keyof IGameFilters>(key: K, value: IGameFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando jogos" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (jogos.length === 0) {
      return (
        <EmptyStateGlobal
          title="Nenhum jogo gerado"
          description="Os jogos aparecem aqui quando a competição é iniciada."
        />
      );
    }

    const visiveis = filterGames(jogos, filters);
    const faseSelecionada = fases.find((fase) => fase.id === filters.faseId);
    const gruposDaFase = grupos.filter((grupo) => grupo.fase_id === filters.faseId);

    return (
      <>
        <Count>{pluralize(visiveis.length, 'jogo', 'jogos')}</Count>
        {visiveis.length === 0 ? (
          <EmptyStateGlobal title="Nenhum jogo com esses filtros" />
        ) : (
          <List aria-label="Jogos">
            {visiveis.map((jogo) => {
              const status = gameStatus(jogo.status);
              return (
                <li key={jogo.id}>
                  <GameCardGlobal
                    to={paths.gameScoreSheet(competitionId, jogo.id)}
                    home={jogo.casa?.nome ?? 'A definir'}
                    away={jogo.fora?.nome ?? 'A definir'}
                    homeScore={jogo.placar_casa}
                    awayScore={jogo.placar_fora}
                    statusLabel={status.label}
                    statusTone={status.tone}
                    description={describeGame(jogo)}
                    actionLabel={hasResult(jogo) ? 'Editar resultado' : 'Lançar súmula ou W.O.'}
                  />
                </li>
              );
            })}
          </List>
        )}
        {faseSelecionada && faseSelecionada.tipo !== 'mata_mata' && (
          <Adjustments>
            {faseSelecionada.tipo === 'grupos' ? (
              gruposDaFase.map((grupo) => (
                <TieAdjust
                  key={grupo.id}
                  fase={faseSelecionada}
                  grupoId={grupo.id}
                  title={`Empate técnico — Grupo ${grupo.nome}`}
                />
              ))
            ) : (
              <TieAdjust fase={faseSelecionada} grupoId={null} title="Empate técnico" />
            )}
          </Adjustments>
        )}
      </>
    );
  };

  return (
    <>
      <PageHeaderGlobal title="Jogos" subtitle="Lance súmulas, placares e W.O. Escolha uma fase para ajustar empates técnicos." />
      <Filters>
        <SelectGlobal
          label="Fase"
          value={filters.faseId}
          options={[{ value: '', label: 'Todas' }, ...fases.map((fase) => ({ value: fase.id, label: fase.nome }))]}
          onChange={(event) => setFilter('faseId', event.target.value)}
        />
        <SelectGlobal
          label="Time"
          value={filters.timeId}
          options={[{ value: '', label: 'Todos' }, ...times.map((time) => ({ value: time.id, label: time.nome }))]}
          onChange={(event) => setFilter('timeId', event.target.value)}
        />
        <SelectGlobal
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(event) => setFilter('status', event.target.value as StatusJogo | '')}
        />
      </Filters>
      {renderContent()}
    </>
  );
}
