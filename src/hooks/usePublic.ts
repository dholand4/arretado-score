import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { liveSheetService } from '@/services/liveSheetService';
import { phasesService } from '@/services/phasesService';
import { publicService } from '@/services/publicService';
import { supabase } from '@/services/supabaseService';
import { analyzeFormat, buildFormatSummary, phaseFromDb } from '@/utils/phaseFormat';

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

// Lances de um jogo já encerrado pela mesa (seção 6.5.1): uma leitura só, sem Realtime. Usa a mesma
// chave do jogo ao vivo, então quem assistia ao jogo já tem os lances quando ele termina.
export function usePublicPlayLog(jogoId: string, enabled: boolean) {
  const query = useQuery({
    queryKey: QUERY_KEYS.liveGame(jogoId),
    queryFn: () => liveSheetService.getContext(jogoId),
    enabled,
  });
  // Desligado, não devolve o que o jogo ao vivo deixou no cache (a chave é a mesma).
  return { mesa: enabled ? query.data : undefined, isLoading: enabled && query.isPending, error: query.error };
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

export function usePublicPlayer(jogadorId: string) {
  const query = useQuery({ queryKey: QUERY_KEYS.publicPlayer(jogadorId), queryFn: () => publicService.getPlayer(jogadorId) });
  return { atleta: query.data, isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

// Formato da competição para o visitante: fases com status e grupos, e o resumo em fluxo.
export function usePublicFormat(competicaoId: string | undefined) {
  const query = useQuery({
    queryKey: QUERY_KEYS.publicPhases(competicaoId ?? ''),
    queryFn: () => phasesService.list(competicaoId as string),
    enabled: Boolean(competicaoId),
  });
  const { times } = usePublicTeams(competicaoId);
  const resumo = useMemo(() => {
    const forms = (query.data ?? []).map(phaseFromDb);
    return buildFormatSummary(forms, analyzeFormat(forms, times.length));
  }, [query.data, times.length]);
  return { fases: query.data ?? [], resumo, isLoading: query.isPending, error: query.error };
}

// Atualização ao vivo (seção 9.1): qualquer mudança em jogos, séries ou súmula
// da competição recarrega jogos, detalhe, fases, tabela, playoffs, rankings, times e jogadores.
export function useRealtimeCompetition(competicaoId: string | undefined, slug: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!competicaoId) return;
    const refresh = () => {
      for (const key of [
        QUERY_KEYS.publicGames(competicaoId),
        QUERY_KEYS.publicPhases(competicaoId),
        ['public-game'],
        QUERY_KEYS.classificationAll,
        QUERY_KEYS.rankingAll,
        QUERY_KEYS.bracket(slug),
        ['public-team'],
        ['public-player'],
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
