import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { usersService } from '@/services/usersService';

export function useUsers() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEYS.users, queryFn: usersService.list });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });

  const createUser = useMutation({ mutationFn: usersService.create, onSuccess: invalidate });
  const updateUser = useMutation({ mutationFn: usersService.update, onSuccess: invalidate });
  const resetPassword = useMutation({ mutationFn: usersService.resetPassword, onSuccess: invalidate });

  return {
    users: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    createUser,
    updateUser,
    resetPassword,
  };
}
