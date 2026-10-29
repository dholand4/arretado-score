import { act, renderHook, waitFor } from '@testing-library/react';
import { useEventCandidates, useEvents } from '@/hooks/useEvents';
import { eventsService } from '@/services/eventsService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/eventsService');

const input = { data: '2026-11-07', local: 'Ginásio', hora_inicio: '19:00', qtd_jogos: 3, intervalo_min: 90, observacoes: '' };

describe('useEvents', () => {
  it('lists events and creates a day (asking about double games)', async () => {
    vi.mocked(eventsService.list).mockResolvedValue([{ id: 'e1', jogos: [] }] as never);
    vi.mocked(eventsService.create).mockResolvedValue({ precisa_confirmar: true, max_sem_repeticao: 2 } as never);
    const { result } = renderHook(() => useEvents('c1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.events).toHaveLength(1));
    const montagem = await act(() => result.current.createEvent.mutateAsync({ input, permitirDuplo: false }));
    expect(montagem.precisa_confirmar).toBe(true);
    expect(eventsService.create).toHaveBeenCalledWith('c1', input, false);
  });

  it('edits a draft day', async () => {
    vi.mocked(eventsService.list).mockResolvedValue([] as never);
    vi.mocked(eventsService.redraw).mockResolvedValue({ precisa_confirmar: false } as never);
    vi.mocked(eventsService.reorder).mockResolvedValue();
    vi.mocked(eventsService.swapGame).mockResolvedValue();
    vi.mocked(eventsService.removeGame).mockResolvedValue();
    vi.mocked(eventsService.publish).mockResolvedValue();
    vi.mocked(eventsService.remove).mockResolvedValue(2);
    const { result } = renderHook(() => useEvents('c1'), { wrapper: createQueryWrapper() });
    await act(() => result.current.redrawEvent.mutateAsync({ eventoId: 'e1', permitirDuplo: true, qtdJogos: 2 }));
    await act(() => result.current.reorderEvent.mutateAsync({ eventoId: 'e1', jogoIds: ['j2', 'j1'] }));
    await act(() => result.current.swapGame.mutateAsync({ saiId: 'j1', entraId: 'j3' }));
    await act(() => result.current.removeGame.mutateAsync('j2'));
    await act(() => result.current.publishEvent.mutateAsync('e1'));
    await act(() => result.current.deleteEvent.mutateAsync('e1'));
    expect(eventsService.redraw).toHaveBeenCalledWith('e1', true, 2);
    expect(eventsService.reorder).toHaveBeenCalledWith('e1', ['j2', 'j1']);
    expect(eventsService.swapGame).toHaveBeenCalledWith('j1', 'j3');
    expect(eventsService.removeGame).toHaveBeenCalledWith('j2', expect.anything());
    expect(eventsService.publish).toHaveBeenCalledWith('e1', expect.anything());
    expect(eventsService.remove).toHaveBeenCalledWith('e1', expect.anything());
  });

  it('loads swap candidates only when enabled', async () => {
    vi.mocked(eventsService.listCandidates).mockResolvedValue([{ id: 'j9' }] as never);
    const { result, rerender } = renderHook(({ on }) => useEventCandidates('c1', on), {
      wrapper: createQueryWrapper(),
      initialProps: { on: false },
    });
    expect(eventsService.listCandidates).not.toHaveBeenCalled();
    rerender({ on: true });
    await waitFor(() => expect(result.current.candidates).toHaveLength(1));
  });
});
