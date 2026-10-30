import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { gamesService } from '@/services/gamesService';

export interface IPreviewRound {
  rodada: number;
  jogos: string[];
  folga: string[];
}

// Como ficariam os jogos de uma fase de todos contra todos com estes times (antes de iniciar).
export function useGamesPreview(times: string[], turnos: number, enabled: boolean) {
  const query = useQuery({
    queryKey: QUERY_KEYS.roundRobinPreview(times.length, turnos),
    queryFn: () => gamesService.previewRoundRobin(times.length, turnos),
    enabled: enabled && times.length >= 2,
  });

  const rodadas: IPreviewRound[] = [];
  for (const par of query.data ?? []) {
    let rodada = rodadas.find((r) => r.rodada === par.rodada);
    if (!rodada) {
      rodada = { rodada: par.rodada, jogos: [], folga: [] };
      rodadas.push(rodada);
    }
    rodada.jogos.push(`${times[par.casa - 1]} x ${times[par.fora - 1]}`);
  }
  for (const rodada of rodadas) {
    const jogando = new Set((query.data ?? []).filter((p) => p.rodada === rodada.rodada).flatMap((p) => [p.casa, p.fora]));
    rodada.folga = times.filter((_, i) => !jogando.has(i + 1));
  }
  rodadas.sort((a, b) => a.rodada - b.rodada);

  return {
    rodadas,
    totalJogos: (query.data ?? []).length,
    isLoading: enabled && times.length >= 2 && query.isPending,
    error: query.error,
  };
}
