import { act, renderHook, waitFor } from '@testing-library/react';
import { useTeamRoster } from '@/hooks/useTeamRoster';
import { playersService } from '@/services/teamsService';
import { createConfirmingQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/teamsService');

const team = { id: 't1', competicao_id: 'c1' };
const player = { id: 'j1', nome: 'Carlos', ativo: true, competicao_id: 'c1' };

beforeEach(() => {
  vi.mocked(playersService.list).mockResolvedValue([player] as never);
});

describe('useTeamRoster', () => {
  it('owner roster cannot delete', async () => {
    const { result } = renderHook(() => useTeamRoster(team, false), { wrapper: createConfirmingQueryWrapper() });
    await waitFor(() => expect(result.current.rosterProps.players).toHaveLength(1));
    expect(result.current.rosterProps.onDelete).toBeUndefined();
  });

  it('opens the form and creates a player', async () => {
    vi.mocked(playersService.create).mockResolvedValue({ id: 'j2' } as never);
    const { result } = renderHook(() => useTeamRoster(team, true), { wrapper: createConfirmingQueryWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.rosterProps.onAdd());
    expect(result.current.formProps?.player).toBeUndefined();
    const input = { nome: 'Novo', apelido: '', numero: 10, posicao: '', documento: '', ativo: true };
    act(() => result.current.formProps?.onSubmit(input, { kind: 'keep' }));
    await waitFor(() => expect(playersService.create).toHaveBeenCalledWith(team, input, { kind: 'keep' }));
    await waitFor(() => expect(result.current.formProps).toBeNull());
  });

  it('toggles a player active flag', async () => {
    vi.mocked(playersService.setActive).mockResolvedValue();
    const { result } = renderHook(() => useTeamRoster(team, true), { wrapper: createConfirmingQueryWrapper() });
    await waitFor(() => expect(result.current.rosterProps.players).toHaveLength(1));
    act(() => result.current.rosterProps.onToggleActive(player as never));
    await waitFor(() => expect(playersService.setActive).toHaveBeenCalledWith('j1', false));
  });
});
