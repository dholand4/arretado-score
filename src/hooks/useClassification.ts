import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { gamesService } from '@/services/gamesService';

interface IClassificationPhase {
  id: string;
  tipo: string;
  classificam: number | null;
  melhores_extras: number;
}

// Classificação ordenada (com desempates) e, em grupos, os melhores extras (seção 6.3).
export function useClassification(fase: IClassificationPhase, grupoId: string | null) {
  const query = useQuery({
    queryKey: QUERY_KEYS.classification(fase.id, grupoId),
    queryFn: () => gamesService.getClassification(fase.id, grupoId),
  });
  const colocacaoExtra = (fase.classificam ?? 0) + 1;
  const comExtras = fase.tipo === 'grupos' && fase.melhores_extras > 0 && fase.classificam !== null;
  const extras = useQuery({
    queryKey: QUERY_KEYS.bestExtras(fase.id, colocacaoExtra),
    queryFn: () => gamesService.getBestExtras(fase.id, colocacaoExtra),
    enabled: comExtras,
  });

  const extrasClassificados = (extras.data ?? [])
    .filter((e) => e.posicao <= fase.melhores_extras)
    .map((e) => e.time_id);

  return {
    linhas: query.data ?? [],
    extrasClassificados,
    isLoading: query.isPending || (comExtras && extras.isPending),
    error: query.error ?? extras.error,
    refetch: () => {
      void query.refetch();
      if (comExtras) void extras.refetch();
    },
  };
}

export function useAdjustClassification(faseId: string, grupoId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ timeId, prioridade }: { timeId: string; prioridade: number | null }) =>
      gamesService.adjustClassification(faseId, grupoId, timeId, prioridade),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.classification(faseId, grupoId) }),
  });
}

export function usePublicStandings(slug: string) {
  const query = useQuery({ queryKey: QUERY_KEYS.publicStandings(slug), queryFn: () => gamesService.getPublicStandings(slug) });
  return { tabela: query.data, isLoading: query.isPending, error: query.error, refetch: query.refetch };
}
