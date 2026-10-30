import { act, renderHook, waitFor } from '@testing-library/react';
import { useGames } from '@/hooks/useGames';
import { useScoreSheet } from '@/hooks/useScoreSheet';
import { gamesService } from '@/services/gamesService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/gamesService');

describe('useGames', () => {
  it('exposes games, phases, teams and groups', async () => {
    vi.mocked(gamesService.listContext).mockResolvedValue({
      jogos: [{ id: 'g1' }],
      fases: [{ id: 'f1' }],
      times: [],
      grupos: [],
    } as never);
    const { result } = renderHook(() => useGames('c1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.jogos).toHaveLength(1));
    expect(result.current.fases).toHaveLength(1);
    expect(gamesService.listContext).toHaveBeenCalledWith('c1');
  });
});

describe('useScoreSheet', () => {
  it('loads the sheet and saves through the RPC service', async () => {
    vi.mocked(gamesService.getScoreSheet).mockResolvedValue({ jogo: { id: 'g1' } } as never);
    vi.mocked(gamesService.saveResult).mockResolvedValue();
    const { result } = renderHook(() => useScoreSheet('c1', 'g1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.sumula).toBeDefined());
    const input = { modo: 'placar' as const, casa: 10, fora: 7, ausente: null, jogadores: [] };
    await act(() => result.current.saveResult.mutateAsync(input));
    expect(gamesService.saveResult).toHaveBeenCalledWith('g1', input);
  });
});
