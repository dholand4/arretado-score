import { act, renderHook, waitFor } from '@testing-library/react';
import { useGamesProgress, usePhases } from '@/hooks/usePhases';
import { phasesService } from '@/services/phasesService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/phasesService');

describe('usePhases', () => {
  it('lists, saves phases and starts the competition', async () => {
    vi.mocked(phasesService.list).mockResolvedValue([{ id: 'f1' }] as never);
    vi.mocked(phasesService.save).mockResolvedValue();
    vi.mocked(phasesService.start).mockResolvedValue(10);
    const { result } = renderHook(() => usePhases('c1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.phases).toHaveLength(1));

    const payload = [{ nome: 'Fase 1', tipo: 'todos_contra_todos' }] as never;
    await act(() => result.current.savePhases.mutateAsync(payload));
    expect(phasesService.save).toHaveBeenCalledWith('c1', payload);

    await act(async () => {
      expect(await result.current.startCompetition.mutateAsync({ A: ['t1', 't2'] })).toBe(10);
    });
    expect(phasesService.start).toHaveBeenCalledWith('c1', { A: ['t1', 't2'] });
  });

  it('redraws the groups of a phase', async () => {
    vi.mocked(phasesService.list).mockResolvedValue([] as never);
    vi.mocked(phasesService.redrawGroups).mockResolvedValue(12);
    const { result } = renderHook(() => usePhases('c1'), { wrapper: createQueryWrapper() });
    await act(() => result.current.redrawGroups.mutateAsync({ faseId: 'f1' }));
    expect(phasesService.redrawGroups).toHaveBeenCalledWith('f1', undefined);
  });

  it('loads the games progress only when enabled', async () => {
    vi.mocked(phasesService.listGamesProgress).mockResolvedValue([{ id: 'j1' }] as never);
    const disabled = renderHook(() => useGamesProgress('c1', false), { wrapper: createQueryWrapper() });
    expect(disabled.result.current.isLoading).toBe(false);
    expect(phasesService.listGamesProgress).not.toHaveBeenCalled();
    const { result } = renderHook(() => useGamesProgress('c1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.games).toHaveLength(1));
  });
});
