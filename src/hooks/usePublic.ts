import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { publicService } from '@/services/publicService';
import { supabase } from '@/services/supabaseService';

export function usePublicCompetition(slug: string) {
  const query = useQuery({ queryKey: QUERY_KEYS.publicCompetition(slug), queryFn: () => publicService.getCompetition(slug) });
  return { competicao: query.data, isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

export function usePublicGames(competicaoId: string | undefined) {
  const query = useQuery({
    queryKey: QUERY_KEYS.publicGames(competicaoId ?? ''),
    queryFn: () => publicService.listGames(competicaoId as string),
    enabled: Boolean(competicaoId),
  });
  return { jogos: query.data ?? [], isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

export function usePublicGame(jogoId: string) {
  const query = useQuery({ queryKey: QUERY_KEYS.publicGame(jogoId), queryFn: () => publicService.getGame(jogoId) });
  return { detalhe: query.data, isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

export function useRanking(competicaoId: string | undefined, faseId: string | null) {
  const query = useQuery({
    queryKey: QUERY_KEYS.ranking(competicaoId ?? '', faseId),
    queryFn: () => publicService.getRanking(competicaoId as string, faseId),
    enabled: Boolean(competicaoId),
  });
  return { ranking: query.data, isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

export function usePublicTeams(competicaoId: string | undefined) {
  const query = useQuery({
    queryKey: QUERY_KEYS.publicTeams(competicaoId ?? ''),
    queryFn: () => publicService.listTeams(competicaoId as string),
    enabled: Boolean(competicaoId),
  });
  return { times: query.data ?? [], isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

export function usePublicTeam(timeId: string) {
  const query = useQuery({ queryKey: QUERY_KEYS.publicTeam(timeId), queryFn: () => publicService.getTeam(timeId) });
  return { equipe: query.data, isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

// Atualização ao vivo (seção 9.1): qualquer mudança em jogos, séries ou súmula
// da competição recarrega jogos, detalhe, tabela, playoffs e rankings.
export function useRealtimeCompetition(competicaoId: string | undefined, slug: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!competicaoId) return;
    const refresh = () => {
      for (const key of [
        QUERY_KEYS.publicGames(competicaoId),
        ['public-game'],
        QUERY_KEYS.classificationAll,
        QUERY_KEYS.rankingAll,
        QUERY_KEYS.bracket(slug),
        ['public-team'],
      ]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    };
    const channel = supabase
      .channel(`competicao-${competicaoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jogos', filter: `competicao_id=eq.${competicaoId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'series' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sumula_estatisticas' }, refresh)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [competicaoId, slug, queryClient]);
}
