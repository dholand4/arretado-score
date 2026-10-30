import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IResultadoInput } from '@/@types/game';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { gamesService } from '@/services/gamesService';

export function useScoreSheet(competicaoId: string, jogoId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEYS.scoreSheet(jogoId), queryFn: () => gamesService.getScoreSheet(jogoId) });

  // O resultado mexe em tabela, séries, fases e dias de jogos.
  const saveResult = useMutation({
    mutationFn: (input: IResultadoInput) => gamesService.saveResult(jogoId, input),
    onSuccess: () => {
      for (const key of [
        QUERY_KEYS.scoreSheet(jogoId),
        QUERY_KEYS.games(competicaoId),
        QUERY_KEYS.classificationAll,
        QUERY_KEYS.events(competicaoId),
        QUERY_KEYS.gamesProgress(competicaoId),
        QUERY_KEYS.phases(competicaoId),
        QUERY_KEYS.competition(competicaoId),
      ]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });

  return { sumula: query.data, isLoading: query.isPending, error: query.error, refetch: query.refetch, saveResult };
}
