import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ICategoria, ICategoriaInput } from '@/@types/competition';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { categoriesService } from '@/services/categoriesService';

export function useCategories(competicaoId: string) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.categories(competicaoId);
  const query = useQuery({ queryKey: key, queryFn: () => categoriesService.list(competicaoId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const createCategory = useMutation({
    mutationFn: (input: ICategoriaInput) => categoriesService.create(competicaoId, input),
    onSuccess: invalidate,
  });
  const updateCategory = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ICategoriaInput & { ativa: boolean }> }) =>
      categoriesService.update(id, patch),
    onSuccess: invalidate,
  });
  const removeCategory = useMutation({ mutationFn: categoriesService.remove, onSuccess: invalidate });
  const moveCategory = useMutation({
    mutationFn: ({ a, b }: { a: ICategoria; b: ICategoria }) => categoriesService.swapOrder(a, b),
    onSettled: invalidate,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    createCategory,
    updateCategory,
    removeCategory,
    moveCategory,
  };
}
