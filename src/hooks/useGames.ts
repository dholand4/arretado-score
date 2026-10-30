import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { gamesService } from '@/services/gamesService';

// Jogos da competição com fases, times e grupos (painel do admin).
export function useGames(competicaoId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.games(competicaoId),
    queryFn: () => gamesService.listContext(competicaoId),
  });
  return {
    jogos: query.data?.jogos ?? [],
    fases: query.data?.fases ?? [],
    times: query.data?.times ?? [],
    grupos: query.data?.grupos ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
