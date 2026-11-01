import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { gamesService } from '@/services/gamesService';
import { supabase } from '@/services/supabaseService';

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

// Painel da liga ao vivo: um resultado salvo em outra aba ou outro aparelho (a mesa no tablet,
// por exemplo) aparece sem recarregar na lista de jogos, na súmula, na tabela e nos dias de jogos.
export function useRealtimeCompetitionGames(competicaoId: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      for (const key of [
        QUERY_KEYS.games(competicaoId),
        ['games'],
        QUERY_KEYS.events(competicaoId),
        QUERY_KEYS.gamesProgress(competicaoId),
        QUERY_KEYS.phases(competicaoId),
        QUERY_KEYS.classificationAll,
      ]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    };
    const channel = supabase
      .channel(`painel-jogos-${competicaoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jogos', filter: `competicao_id=eq.${competicaoId}` }, refresh)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [competicaoId, queryClient]);
}
