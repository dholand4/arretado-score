import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { gamesService } from '@/services/gamesService';
import { getErrorMessage } from '@/utils/appError';
import { Box, Line } from './style';
import type { IStandingsAdjustProps } from './types';
export function StandingsAdjustGlobal({ phase, group }: IStandingsAdjustProps) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEYS.classification(phase,group), queryFn: () => gamesService.classification(phase,group) });
  const [priorities, setPriorities] = useState<Record<string,string>>({});
  const mutation = useMutation({ mutationFn: ({team,priority}: {team:string;priority:number | null}) => gamesService.adjust(phase,group,team,priority), onSuccess: () => void client.invalidateQueries({queryKey:QUERY_KEYS.classification(phase,group)}) });
  if (query.isPending) return <p>Carregando classificação…</p>;
  if (query.error) return <AlertGlobal variant="error" message={getErrorMessage(query.error)} />;
  const tied = query.data.filter((row) => row.empate_tecnico);
  if (!tied.length) return <p>Não há empate técnico nesta classificação.</p>;
  return <Box><p>Em caso de empate técnico, use números menores para priorizar um time. A alteração fica registrada.</p>{mutation.error && <AlertGlobal variant="error" message={getErrorMessage(mutation.error)} />}{tied.map((row) => <Line key={row.time_id}>
    <InputGlobal label={`Prioridade de ${row.nome}`} type="number" min={1} step={1} value={priorities[row.time_id] ?? ''} onChange={(event) => setPriorities((current) => ({...current,[row.time_id]:event.target.value}))} />
    <ButtonGlobal label="Salvar ajuste" size="sm" disabled={mutation.isPending || !priorities[row.time_id] || Number(priorities[row.time_id]) < 1} onClick={() => mutation.mutate({team:row.time_id,priority:Number(priorities[row.time_id])})} />
    <ButtonGlobal label="Remover ajuste" size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({team:row.time_id,priority:null})} />
  </Line>)}</Box>;
}
