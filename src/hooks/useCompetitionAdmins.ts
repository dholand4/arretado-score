import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { competitionsService, peopleService } from '@/services/competitionsService';

export function useCompetitionAdmins(competicaoId: string) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.competitionAdmins(competicaoId);
  const query = useQuery({ queryKey: key, queryFn: () => competitionsService.listAdmins(competicaoId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const addAdmin = useMutation({
    mutationFn: (userId: string) => competitionsService.addAdmin(competicaoId, userId),
    onSuccess: invalidate,
  });
  const removeAdmin = useMutation({
    mutationFn: (userId: string) => competitionsService.removeAdmin(competicaoId, userId),
    onSuccess: invalidate,
  });

  return { admins: query.data ?? [], isLoading: query.isPending, error: query.error, refetch: query.refetch, addAdmin, removeAdmin };
}

export function useDonos(enabled = true) {
  const query = useQuery({ queryKey: QUERY_KEYS.donos, queryFn: peopleService.listDonos, enabled });
  return { donos: query.data ?? [], isLoading: query.isPending && enabled };
}

export function useAdminUsers() {
  const query = useQuery({ queryKey: QUERY_KEYS.adminUsers, queryFn: peopleService.listAdmins });
  return { adminUsers: query.data ?? [], isLoading: query.isPending };
}
