import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ICompeticaoBasicos,
  ICompeticaoPontuacao,
  ImageChange,
} from '@/@types/competition';
import type { ICompeticaoCobranca } from '@/@types/finance';
import type { IRegrasPartida } from '@/@types/liveSheet';
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
    // O master cria a liga e já entrega para o admin escolhido (opcional; dá para definir depois em Admins).
    mutationFn: async ({ input, logo, adminId }: { input: ICompeticaoBasicos; logo: ImageChange; adminId?: string }) => {
      const id = await competitionsService.create(input, logo);
      if (adminId) await competitionsService.addAdmin(id, adminId);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions }),
  });
}

// Só o nome/status para o menu lateral; não busca nada fora de uma competição.
export function useCompetitionSummary(competicaoId: string | undefined) {
  const query = useQuery({
    queryKey: QUERY_KEYS.competition(competicaoId ?? ''),
    queryFn: () => competitionsService.get(competicaoId ?? ''),
    enabled: Boolean(competicaoId),
  });
  return { competition: competicaoId ? query.data : undefined };
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

  // Regras da partida (súmula ao vivo): fora da trava de estrutura.
  const saveMatchRules = useMutation({
    mutationFn: (input: IRegrasPartida) => competitionsService.update(competicaoId, input),
    onSuccess: onSaved,
  });

  const saveBilling = useMutation({
    mutationFn: (input: ICompeticaoCobranca) => competitionsService.update(competicaoId, input),
    onSuccess: onSaved,
  });

  const setActive = useMutation({
    mutationFn: (ativa: boolean) => competitionsService.setActive(competicaoId, ativa),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competition(competicaoId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions, exact: true });
    },
  });

  return {
    competition: query.data,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    saveBasics,
    saveScoring,
    saveMatchRules,
    saveBilling,
    setActive,
  };
}
