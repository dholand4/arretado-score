import { act, renderHook, waitFor } from '@testing-library/react';
import { useAdjustClassification, useClassification, usePublicStandings } from '@/hooks/useClassification';
import { gamesService } from '@/services/gamesService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/gamesService');

describe('useClassification', () => {
  it('loads the ordered standings without extras outside group phases', async () => {
    vi.mocked(gamesService.getClassification).mockResolvedValue([{ time_id: 't1', posicao: 1 }] as never);
    const fase = { id: 'f1', tipo: 'todos_contra_todos', classificam: 4, melhores_extras: 0 };
    const { result } = renderHook(() => useClassification(fase, null), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.linhas).toHaveLength(1));
    expect(gamesService.getBestExtras).not.toHaveBeenCalled();
  });

  it('marks the best extras that qualify in group phases', async () => {
    vi.mocked(gamesService.getClassification).mockResolvedValue([]);
    vi.mocked(gamesService.getBestExtras).mockResolvedValue([
      { posicao: 1, time_id: 'x1' },
      { posicao: 2, time_id: 'x2' },
    ] as never);
    const fase = { id: 'f2', tipo: 'grupos', classificam: 2, melhores_extras: 1 };
    const { result } = renderHook(() => useClassification(fase, 'g1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.extrasClassificados).toEqual(['x1']));
    expect(gamesService.getBestExtras).toHaveBeenCalledWith('f2', 3);
  });
});

describe('useAdjustClassification', () => {
  it('saves and removes a manual priority', async () => {
    vi.mocked(gamesService.adjustClassification).mockResolvedValue();
    const { result } = renderHook(() => useAdjustClassification('f1', null), { wrapper: createQueryWrapper() });
    await act(() => result.current.mutateAsync({ timeId: 't1', prioridade: null }));
    expect(gamesService.adjustClassification).toHaveBeenCalledWith('f1', null, 't1', null);
  });
});

describe('usePublicStandings', () => {
  it('loads the public table by slug', async () => {
    vi.mocked(gamesService.getPublicStandings).mockResolvedValue({ competicao: { nome: 'Liga' } } as never);
    const { result } = renderHook(() => usePublicStandings('liga'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.tabela?.competicao.nome).toBe('Liga'));
  });
});
