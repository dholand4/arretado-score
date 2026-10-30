import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { StatusJogo } from '@/@types/event';
import type { IJogosContexto } from '@/@types/game';
import { AlertGlobal } from '@/components/alertGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { GameCardGlobal } from '@/components/gameCardGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { MatchupPreviewGlobal } from '@/components/matchupPreviewGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { StandingsAdjustGlobal } from '@/components/standingsAdjustGlobal';
import { STATUS_JOGO } from '@/constants/phase';
import { useAdjustClassification, useClassification } from '@/hooks/useClassification';
import { useCompetition } from '@/hooks/useCompetitions';
import { useGames } from '@/hooks/useGames';
import { useGamesPreview } from '@/hooks/useGamesPreview';
import { usePhases } from '@/hooks/usePhases';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useTeams } from '@/hooks/useTeams';
import { paths, type IGamesRouteState } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { currentPhaseId, describeGame, filterGames, gameStatus, hasResult, type IGameFilters } from '@/utils/games';
import { pluralize } from '@/utils/text';
import { CompetitionOverviewScreen } from '@/view/competitionOverviewScreen';
import { Adjustments, Count, Filters, List, Notice } from './style';

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

// Antes de iniciar: como ficariam os confrontos da primeira fase e o botão de iniciar.
function DraftPreview({ competitionId }: { competitionId: string }) {
  const { teams } = useTeams(competitionId);
  const { phases } = usePhases(competitionId);
  const primeira = phases[0];
  const todosContraTodos = primeira?.tipo === 'todos_contra_todos';
  const nomes = teams.map((t) => t.nome);
  const { rodadas, totalJogos, isLoading } = useGamesPreview(nomes, primeira?.turnos ?? 1, todosContraTodos);

  return (
    <Adjustments>
      {!primeira && (
        <EmptyStateGlobal
          title="Configure as fases para ver os jogos"
          description="Com os times cadastrados e a primeira fase definida, os confrontos aparecem aqui."
        />
      )}
      {primeira && !todosContraTodos && (
        <EmptyStateGlobal
          title={`${primeira.nome}: jogos por grupo`}
          description="Os grupos são sorteados (ou distribuídos) ao iniciar; aí os confrontos de cada grupo aparecem aqui."
        />
      )}
      {todosContraTodos && nomes.length < 2 && (
        <EmptyStateGlobal title="Cadastre ao menos 2 times" description="Os confrontos aparecem assim que houver times." />
      )}
      {todosContraTodos && isLoading && <LoaderGlobal label="Montando os confrontos" />}
      {todosContraTodos && rodadas.length > 0 && (
        <MatchupPreviewGlobal
          title={`${primeira.nome}: ${pluralize(totalJogos, 'jogo', 'jogos')}`}
          rounds={rodadas}
          note="Prévia: todos se enfrentam. A ordem das rodadas é definida ao iniciar a competição."
        />
      )}
      <CompetitionOverviewScreen embedded />
    </Adjustments>
  );
}

export function GamesScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const { competition } = useCompetition(competitionId);
  const { jogos, fases, times, grupos, isLoading, error, refetch } = useGames(competitionId);
  // Fase nula = automática: acompanha a fase em andamento até o admin escolher outra.
  const [faseEscolhida, setFaseEscolhida] = useState<string | null>(null);
  const [outrosFiltros, setOutrosFiltros] = useState<Omit<IGameFilters, 'faseId'>>({ timeId: '', status: '' });
  const filters: IGameFilters = { ...outrosFiltros, faseId: faseEscolhida ?? currentPhaseId(fases) };
  const notice = (useLocation().state as IGamesRouteState | null)?.notice;
  const [showNotice, setShowNotice] = useState(Boolean(notice));

  const setFilter = <K extends keyof IGameFilters>(key: K, value: IGameFilters[K]) => {
    if (key === 'faseId') setFaseEscolhida(value as string);
    else setOutrosFiltros((current) => ({ ...current, [key]: value }));
  };

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando jogos" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (competition?.status === 'rascunho') return <DraftPreview competitionId={competitionId} />;
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
      {notice && showNotice && (
        <Notice>
          <AlertGlobal variant="success" message={notice} onClose={() => setShowNotice(false)} />
        </Notice>
      )}
      {competition?.status !== 'rascunho' && (
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
      )}
      {renderContent()}
    </>
  );
}
