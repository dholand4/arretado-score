import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { bracketService } from '@/services/bracketService';
import { bracketOrigin } from '@/utils/bracketOrigin';

export function usePublicBracket(slug: string) {
  const query = useQuery({ queryKey: QUERY_KEYS.bracket(slug), queryFn: () => bracketService.load(slug) });
  const data = query.data;
  const name = (id: string | null) => data?.teams.find((team) => team.id === id)?.nome;
  const logo = (id: string | null) => data?.teams.find((team) => team.id === id)?.logo_url ?? null;
  const phases = data?.phases.map((phase) => ({
    ...phase,
    series: data.series.filter((series) => series.fase_id === phase.id).map((series) => ({
      ...series,
      nameA: name(series.time_a_id) ?? bracketOrigin(series.origem_a),
      nameB: name(series.time_b_id) ?? bracketOrigin(series.origem_b),
      logoA: logo(series.time_a_id),
      logoB: logo(series.time_b_id),
      games: data.games.filter((game) => game.serie_id === series.id).map((game) => ({
        ...game,
        home: name(game.time_casa_id) ?? 'A definir',
        away: name(game.time_fora_id) ?? 'A definir',
      })),
    })),
  })) ?? [];
  const lastPhase = phases.at(-1);
  const final = lastPhase?.series.find((series) => {
    const origin = series.origem_a;
    return !origin || Array.isArray(origin) || typeof origin !== 'object' || origin.tipo !== 'perdedor';
  });
  const champion = data?.competition.status === 'encerrada' ? name(final?.vencedor_id ?? null) : undefined;
  return { ...query, phases, champion };
}

export type IBracketPhase = ReturnType<typeof usePublicBracket>['phases'][number];
