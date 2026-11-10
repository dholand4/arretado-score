import { renderHook, waitFor } from '@testing-library/react';
import { usePublicPlayer } from '@/hooks/usePublic';
import { publicService } from '@/services/publicService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/publicService');
vi.mock('@/services/supabaseService', () => ({ supabase: {} }));

describe('usePublicPlayer', () => {
  it('loads the player page data', async () => {
    const atleta = { jogador: { id: 'j1', nome: 'Carlos' }, jogosDisputados: 2, numeros: [], jogos: [] };
    vi.mocked(publicService.getPlayer).mockResolvedValue(atleta as never);
    const { result } = renderHook(() => usePublicPlayer('j1'), { wrapper: createQueryWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.atleta).toEqual(atleta));
    expect(publicService.getPlayer).toHaveBeenCalledWith('j1');
    expect(result.current.error).toBeNull();
  });

  it('exposes the error when the player is not found', async () => {
    vi.mocked(publicService.getPlayer).mockRejectedValue(new Error('Jogador não encontrado.'));
    const { result } = renderHook(() => usePublicPlayer('x'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.atleta).toBeUndefined();
  });
});
