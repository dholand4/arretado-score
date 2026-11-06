import { act, renderHook, waitFor } from '@testing-library/react';
import { useCategories } from '@/hooks/useCategories';
import { categoriesService } from '@/services/categoriesService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/categoriesService');

describe('useCategories', () => {
  it('loads and creates categories', async () => {
    vi.mocked(categoriesService.list).mockResolvedValue([{ id: 'p' }] as never);
    vi.mocked(categoriesService.create).mockResolvedValue({ id: 'r' } as never);
    const { result } = renderHook(() => useCategories('c1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.categories).toHaveLength(1));
    await act(() => result.current.createCategory.mutateAsync({ nome: 'Rebotes', sigla: 'REB', titulo_ranking: 'Reboteiro', conta_cestas_de: null }));
    expect(categoriesService.create).toHaveBeenCalledWith('c1', { nome: 'Rebotes', sigla: 'REB', titulo_ranking: 'Reboteiro', conta_cestas_de: null });
  });
});
