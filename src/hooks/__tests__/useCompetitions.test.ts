import { act, renderHook, waitFor } from '@testing-library/react';
import { useCompetition, useCompetitions, useCreateCompetition } from '@/hooks/useCompetitions';
import { competitionsService } from '@/services/competitionsService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/competitionsService');

describe('useCompetitions', () => {
  it('lists competitions', async () => {
    vi.mocked(competitionsService.list).mockResolvedValue([{ id: 'c1' }] as never);
    const { result } = renderHook(() => useCompetitions(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.competitions).toHaveLength(1));
  });

  it('creates a competition and returns its id', async () => {
    vi.mocked(competitionsService.create).mockResolvedValue('novo-id');
    const { result } = renderHook(() => useCreateCompetition(), { wrapper: createQueryWrapper() });
    const input = { nome: 'Liga', slug: 'liga', modalidade: 'basquete' as const, descricao: '', local_padrao: '', intervalo_jogos_min: 90 };
    await act(async () => {
      expect(await result.current.mutateAsync({ input, logo: { kind: 'keep' } })).toBe('novo-id');
    });
  });

  it('updates the cached competition after saving the scoring', async () => {
    vi.mocked(competitionsService.get).mockResolvedValue({ id: 'c1', pontos_vitoria: 1 } as never);
    vi.mocked(competitionsService.update).mockResolvedValue({ id: 'c1', pontos_vitoria: 2 } as never);
    const { result } = renderHook(() => useCompetition('c1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.competition?.pontos_vitoria).toBe(1));
    await act(() => result.current.saveScoring.mutateAsync({ pontos_vitoria: 2 } as never));
    await waitFor(() => expect(result.current.competition?.pontos_vitoria).toBe(2));
  });
});
