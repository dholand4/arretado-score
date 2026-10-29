import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ICompeticaoBasicos,
  ICompeticaoPontuacao,
  ImageChange,
} from '@/@types/competition';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { competitionsService } from '@/services/competitionsService';

export function useCompetitions() {
  const query = useQuery({ queryKey: QUERY_KEYS.competitions, queryFn: competitionsService.list });
  return { competitions: query.data ?? [], isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

export function usePublicCompetitions() {
  const query = useQuery({ queryKey: QUERY_KEYS.publicCompetitions, queryFn: competitionsService.listPublic });
  return { competitions: query.data ?? [], isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, logo }: { input: ICompeticaoBasicos; logo: ImageChange }) =>
      competitionsService.create(input, logo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions }),
  });
}

export function useCompetition(competicaoId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.competition(competicaoId),
    queryFn: () => competitionsService.get(competicaoId),
  });

  const onSaved = (data: Awaited<ReturnType<typeof competitionsService.get>>) => {
    queryClient.setQueryData(QUERY_KEYS.competition(competicaoId), data);
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions, exact: true });
  };

  const saveBasics = useMutation({
    mutationFn: ({ input, logo }: { input: ICompeticaoBasicos; logo: ImageChange }) =>
      competitionsService.updateBasics(competicaoId, input, logo),
    onSuccess: (data) => {
      onSaved(data);
      // A troca de modalidade pode renomear a categoria de placar.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories(competicaoId) });
    },
  });

  const saveScoring = useMutation({
    mutationFn: (input: ICompeticaoPontuacao) => competitionsService.update(competicaoId, input),
    onSuccess: onSaved,
  });

  return {
    competition: query.data,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    saveBasics,
    saveScoring,
  };
}
