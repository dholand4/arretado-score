import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CheckboxGlobal } from '@/components/checkboxGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useRouteParams } from '@/hooks/useRouteParams';
import { gamesService } from '@/services/gamesService';
import { getErrorMessage } from '@/utils/appError';
import { Grid, Player, Score, TeamSection } from './style';

type Sheet = Awaited<ReturnType<typeof gamesService.sheet>>;
type Values = Record<string, Record<string, string>>;
function SheetForm({ data }: { data: Sheet }) {
  const client = useQueryClient();
  const { game, competition, categories, players } = data;
  const [mode, setMode] = useState(game.status === 'wo' ? 'wo' : game.so_placar ? 'placar' : 'completa');
  const [present, setPresent] = useState<string[]>(data.presence.map((item) => item.jogador_id));
  const [values, setValues] = useState<Values>(() => {
    const initial: Values = {};
    data.statistics.forEach((item) => { initial[item.jogador_id] ??= {}; initial[item.jogador_id][item.categoria_id] = String(item.valor); });
    return initial;
  });
  const [casa, setCasa] = useState(game.placar_casa?.toString() ?? '');
  const [fora, setFora] = useState(game.placar_fora?.toString() ?? '');
  const [ausente, setAusente] = useState(game.wo_ausente ?? '');
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({ mutationFn: () => gamesService.save(game.id, mode, casa === '' ? null : Number(casa), fora === '' ? null : Number(fora), ausente || null,
    present.map((id) => ({ jogador_id: id, valores: Object.fromEntries(Object.entries(values[id] ?? {}).filter(([, value]) => value !== '').map(([key,value]) => [key, Number(value)])) }))),
    onSuccess: () => { setSaved(true); void client.invalidateQueries({ queryKey: ['etapa4'] }); },
  });
  const phase = data.phases.find((item) => item.id === game.fase_id);
  const next = data.phases.find((item) => item.ordem === (phase?.ordem ?? 0) + 1);
  const limited = phase?.status === 'concluida' && data.games.some((item) => item.fase_id === next?.id && ['encerrado','wo'].includes(item.status));
  const teamName = (id: string) => data.teams.find((item) => item.id === id)?.nome ?? 'Time';
  const scoreCategory = categories.find((item) => item.soma_no_placar);
  const score = (teamId: string) => players.filter((player) => player.time_id === teamId && present.includes(player.id)).reduce((sum, player) => sum + (Number(values[player.id]?.[scoreCategory?.id ?? ''] || 0) || 0), 0);
  const submit = () => { setSaved(false); mutation.mutate(); };
  return <>
    <Score aria-live="polite">{teamName(game.time_casa_id)} {mode === 'completa' ? score(game.time_casa_id) : mode === 'placar' ? casa || '–' : '–'} × {mode === 'completa' ? score(game.time_fora_id) : mode === 'placar' ? fora || '–' : '–'} {teamName(game.time_fora_id)}</Score>
    {limited && <AlertGlobal variant="warning" message="A fase seguinte já tem jogo encerrado. Só o master pode editar esta súmula." />}
    {game.status === 'cancelado' && <AlertGlobal variant="warning" message="Jogo cancelado não recebe súmula." />}
    {saved && <AlertGlobal variant="success" message="Resultado salvo." />}
    {mutation.error && <AlertGlobal variant="error" message={getErrorMessage(mutation.error)} />}
    <SelectGlobal label="Tipo de lançamento" value={mode} onChange={(event) => setMode(event.target.value)} options={[{ value:'completa',label:'Súmula completa' },{ value:'placar',label:'Lançar só o placar' },{ value:'wo',label:'Marcar W.O.' }]} />
    {mode === 'placar' && <><p>O placar conta na tabela. Estatísticas anteriores serão removidas.</p><Grid><InputGlobal label={`Placar ${teamName(game.time_casa_id)}`} type="number" min={0} inputMode="numeric" value={casa} onChange={(event) => setCasa(event.target.value)} /><InputGlobal label={`Placar ${teamName(game.time_fora_id)}`} type="number" min={0} inputMode="numeric" value={fora} onChange={(event) => setFora(event.target.value)} /></Grid></>}
    {mode === 'wo' && <><p>Placar automático: {competition.wo_placar_vencedor} × {competition.wo_placar_perdedor}. W.O. duplo: 0 × 0. Estatísticas anteriores serão removidas.</p><SelectGlobal label="Quem faltou?" value={ausente} onChange={(event) => setAusente(event.target.value)} options={[{value:'',label:'Selecione'}, {value:'casa',label:teamName(game.time_casa_id)}, {value:'fora',label:teamName(game.time_fora_id)}, {value:'ambos',label:'Ambos'}]} /></>}
    {mode === 'completa' && [game.time_casa_id, game.time_fora_id].map((teamId) => <TeamSection key={teamId}><h2>{teamName(teamId)}</h2>{players.filter((player) => player.time_id === teamId).map((player) => <Player key={player.id}>
      <CheckboxGlobal label={`${player.numero !== null ? `${player.numero} · ` : ''}${player.nome} — jogou`} checked={present.includes(player.id)} onChange={(event) => setPresent((current) => event.target.checked ? [...current,player.id] : current.filter((id) => id !== player.id))} />
      <Grid>{categories.map((category) => <InputGlobal key={category.id} label={`${category.sigla} — ${player.nome}`} type="number" min={0} step={1} inputMode="numeric" value={values[player.id]?.[category.id] ?? ''} onChange={(event) => { const value = event.target.value; setValues((current) => ({ ...current, [player.id]: { ...current[player.id], [category.id]: value } })); if (value !== '') setPresent((current) => current.includes(player.id) ? current : [...current,player.id]); }} />)}</Grid>
    </Player>)}</TeamSection>)}
    <ButtonGlobal label="Salvar resultado" onClick={submit} loading={mutation.isPending} disabled={game.status === 'cancelado' || mutation.isPending} />
  </>;
}
export function ScoreSheetScreen() {
  const { competitionId, gameId } = useRouteParams('competitionId','gameId');
  const query = useQuery({ queryKey: QUERY_KEYS.sheet(competitionId,gameId), queryFn: () => gamesService.sheet(competitionId,gameId) });
  return <><PageHeaderGlobal title="Súmula" />{query.isPending ? <LoaderGlobal label="Carregando súmula" /> : query.error ? <ErrorStateGlobal error={query.error} onRetry={() => void query.refetch()} /> : <SheetForm key={gameId} data={query.data} />}</>;
}
