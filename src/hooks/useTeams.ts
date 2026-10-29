import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageChange, ITimeInput } from '@/@types/competition';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { teamsService } from '@/services/teamsService';

export function useTeams(competicaoId: string) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.teams(competicaoId);
  const query = useQuery({ queryKey: key, queryFn: () => teamsService.list(competicaoId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const createTeam = useMutation({
    mutationFn: ({ input, logo }: { input: ITimeInput; logo: ImageChange }) =>
      teamsService.create(competicaoId, input, logo),
    onSuccess: invalidate,
  });
  const removeTeam = useMutation({ mutationFn: teamsService.remove, onSuccess: invalidate });

  return {
    teams: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    createTeam,
    removeTeam,
  };
}

export function useTeam(timeId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEYS.team(timeId), queryFn: () => teamsService.get(timeId) });

  const updateTeam = useMutation({
    mutationFn: ({ patch, logo }: { patch: Partial<ITimeInput>; logo: ImageChange }) => {
      if (!query.data) throw new Error('Time não carregado.');
      return teamsService.update(timeId, query.data.competicao_id, patch, logo);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.team(timeId) });
      if (query.data) void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams(query.data.competicao_id) });
      void queryClient.invalidateQueries({ queryKey: ['my-teams'] });
    },
  });

  return { team: query.data, isLoading: query.isPending, error: query.error, refetch: query.refetch, updateTeam };
}

export function useMyTeams(userId: string) {
  const query = useQuery({ queryKey: QUERY_KEYS.myTeams(userId), queryFn: () => teamsService.listMine(userId) });
  return { teams: query.data ?? [], isLoading: query.isPending, error: query.error, refetch: query.refetch };
}
