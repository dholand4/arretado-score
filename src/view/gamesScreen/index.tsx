import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { StandingsAdjustGlobal } from '@/components/standingsAdjustGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { gamesService } from '@/services/gamesService';
import { Filters, List, GameLink } from './style';

export function GamesScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const query = useQuery({ queryKey: QUERY_KEYS.games(competitionId), queryFn: () => gamesService.context(competitionId) });
  const [phase, setPhase] = useState('');
  const [team, setTeam] = useState('');
  const [status, setStatus] = useState('');
  const data = query.data;
  const games = data?.games.filter((game) => (!phase || game.fase_id === phase) && (!team || game.time_casa_id === team || game.time_fora_id === team) && (!status || game.status === status)) ?? [];
  const name = (id: string) => data?.teams.find((item) => item.id === id)?.nome ?? 'Time';
  return <>
    <PageHeaderGlobal title="Jogos" subtitle="Consulte os jogos e lance súmulas ou W.O." />
    {query.isPending ? <LoaderGlobal label="Carregando jogos" /> : query.error ? <ErrorStateGlobal error={query.error} onRetry={() => void query.refetch()} /> : <>
      <Filters>
        <SelectGlobal label="Fase" value={phase} onChange={(event) => setPhase(event.target.value)} options={[{ value: '', label: 'Todas' }, ...(data?.phases ?? []).map((item) => ({ value: item.id, label: item.nome }))]} />
        <SelectGlobal label="Time" value={team} onChange={(event) => setTeam(event.target.value)} options={[{ value: '', label: 'Todos' }, ...(data?.teams ?? []).map((item) => ({ value: item.id, label: item.nome }))]} />
        <SelectGlobal label="Status" value={status} onChange={(event) => setStatus(event.target.value)} options={[{ value: '', label: 'Todos' }, ...[['pendente','Pendente'],['agendado','Agendado'],['encerrado','Encerrado'],['wo','W.O.'],['cancelado','Cancelado']].map(([value,label]) => ({ value, label }))]} />
      </Filters>
      {phase && data?.phases.find((item) => item.id === phase)?.tipo !== 'mata_mata' && <section><h2>Ajuste de empate técnico</h2>{data?.phases.find((item) => item.id === phase)?.tipo === 'grupos' ? data.groups.filter((group) => group.fase_id === phase).map((group) => <div key={group.id}><h3>Grupo {group.nome}</h3><StandingsAdjustGlobal phase={phase} group={group.id} /></div>) : <StandingsAdjustGlobal phase={phase} group={null} />}</section>}
      {games.length === 0 ? <EmptyStateGlobal title="Nenhum jogo encontrado" /> : <List>{games.map((game) => <li key={game.id}><GameLink to={paths.gameScoreSheet(competitionId,game.id)}>
        <strong>{name(game.time_casa_id)} {game.placar_casa ?? '–'} × {game.placar_fora ?? '–'} {name(game.time_fora_id)}</strong>
        <span>{data?.phases.find((item) => item.id === game.fase_id)?.nome} · {game.status === 'wo' ? 'W.O.' : game.status} · Súmula / W.O.</span>
      </GameLink></li>)}</List>}
    </>}
  </>;
}
