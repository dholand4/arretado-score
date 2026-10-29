import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IDistribuicaoGrupos, IFasePayload } from '@/@types/phase';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { phasesService } from '@/services/phasesService';

// Fases da competição (com séries e grupos), salvar a configuração, iniciar e sortear grupos.
export function usePhases(competicaoId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEYS.phases(competicaoId), queryFn: () => phasesService.list(competicaoId) });

  const invalidateAll = () => {
    // Prefixo da competição: recarrega competição, fases, jogos e dias de jogos.
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competition(competicaoId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions, exact: true });
  };

  const savePhases = useMutation({
    mutationFn: (fases: IFasePayload[]) => phasesService.save(competicaoId, fases),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.phases(competicaoId) }),
  });

  const startCompetition = useMutation({
    mutationFn: (distribuicao?: IDistribuicaoGrupos) => phasesService.start(competicaoId, distribuicao),
    onSuccess: invalidateAll,
  });

  const redrawGroups = useMutation({
    mutationFn: ({ faseId, distribuicao }: { faseId: string; distribuicao?: IDistribuicaoGrupos }) =>
      phasesService.redrawGroups(faseId, distribuicao),
    onSuccess: invalidateAll,
  });

  return {
    phases: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    savePhases,
    startCompetition,
    redrawGroups,
  };
}

// Status dos jogos da competição (para "próximos passos" da visão geral).
export function useGamesProgress(competicaoId: string, enabled = true) {
  const query = useQuery({
    queryKey: QUERY_KEYS.gamesProgress(competicaoId),
    queryFn: () => phasesService.listGamesProgress(competicaoId),
    enabled,
  });
  return { games: query.data ?? [], isLoading: enabled && query.isPending, error: query.error };
}
