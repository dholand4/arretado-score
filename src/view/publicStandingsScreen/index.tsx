import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useRouteParams } from '@/hooks/useRouteParams';
import { gamesService } from '@/services/gamesService';
import { TableWrap, Table, Row } from './style';

type StandingsData = Awaited<ReturnType<typeof gamesService.standings>>;
function GroupTable({ phase, group, draws }: { phase: StandingsData['phases'][number]; group: string | null; draws: boolean }) {
  const query = useQuery({ queryKey: QUERY_KEYS.classification(phase.id, group), queryFn: () => gamesService.classification(phase.id, group) });
  const extras = useQuery({ queryKey: ['etapa4','extras',phase.id,phase.classificam], queryFn: () => gamesService.extras(phase.id, (phase.classificam ?? 0) + 1), enabled: phase.tipo === 'grupos' && phase.melhores_extras > 0 && phase.classificam !== null });
  if (query.isPending) return <LoaderGlobal label="Carregando classificação" />;
  if (query.error) return <ErrorStateGlobal error={query.error} onRetry={() => void query.refetch()} />;
  if (extras.error) return <ErrorStateGlobal error={extras.error} onRetry={() => void extras.refetch()} />;
  if (!query.data.length) return <EmptyStateGlobal title="Ainda não há classificação" />;
  return <TableWrap><Table><thead><tr><th>Pos.</th><th>Time</th><th>J</th><th>V</th>{draws && <th>E</th>}<th>D</th><th>WO</th><th>PTS</th><th>PF</th><th>PC</th><th>SALDO</th><th>%</th></tr></thead><tbody>
    {query.data.map((row) => <Row key={row.time_id} $qualified={row.posicao <= (phase.classificam ?? 0) || !!extras.data?.some((extra) => extra.time_id === row.time_id && extra.posicao <= phase.melhores_extras)}><td>{row.posicao}º</td><td>{row.nome}{row.empate_tecnico && ' *'}</td><td>{row.j}</td><td>{row.v}</td>{draws && <td>{row.e}</td>}<td>{row.d}</td><td>{row.wo}</td><td>{row.pts}</td><td>{row.pf}</td><td>{row.pc}</td><td>{row.saldo}</td><td>{Math.round(row.aproveitamento * 100)}%</td></Row>)}
  </tbody></Table><p>* Empate técnico</p></TableWrap>;
}
function Standings({ data }: { data: StandingsData }) {
  const [phaseId, setPhaseId] = useState(data.phases[0]?.id ?? '');
  const phase = data.phases.find((item) => item.id === phaseId);
  if (!phase) return <EmptyStateGlobal title="Ainda não há fases com tabela" />;
  const groups = data.groups.filter((item) => item.fase_id === phase.id);
  return <>
    <nav aria-label="Fases">{data.phases.map((item) => <ButtonGlobal key={item.id} label={item.nome} variant={phaseId === item.id ? "primary" : "outline"} aria-pressed={phaseId === item.id} onClick={() => setPhaseId(item.id)} />)}</nav>
    {phase.tipo === 'grupos' ? groups.map((group) => <section key={group.id}><h2>Grupo {group.nome}</h2><GroupTable phase={phase} group={group.id} draws={data.competition.permite_empate} /></section>) : <GroupTable phase={phase} group={null} draws={data.competition.permite_empate} />}
  </>;
}
export function PublicStandingsScreen() {
  const { slug } = useRouteParams('slug');
  const query = useQuery({ queryKey: QUERY_KEYS.standings(slug), queryFn: () => gamesService.standings(slug) });
  return <><PageHeaderGlobal title="Tabela" subtitle={query.data?.competition.nome} />{query.isPending ? <LoaderGlobal label="Carregando tabela" /> : query.error ? <ErrorStateGlobal error={query.error} onRetry={() => void query.refetch()} /> : <Standings data={query.data} />}</>;
}
