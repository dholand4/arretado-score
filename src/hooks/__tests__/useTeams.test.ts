import { act, renderHook, waitFor } from '@testing-library/react';
import { useMyTeams, useTeam, useTeams } from '@/hooks/useTeams';
import { teamsService } from '@/services/teamsService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/teamsService');

describe('useTeams', () => {
  it('lists and creates teams of a competition', async () => {
    vi.mocked(teamsService.list).mockResolvedValue([] as never);
    vi.mocked(teamsService.create).mockResolvedValue({ id: 't1' } as never);
    const { result } = renderHook(() => useTeams('c1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() =>
      result.current.createTeam.mutateAsync({ input: { nome: 'A', sigla: '', dono_id: null }, logo: { kind: 'keep' } }),
    );
    expect(teamsService.create).toHaveBeenCalledWith('c1', { nome: 'A', sigla: '', dono_id: null }, { kind: 'keep' });
  });

  it('updates a team using its competition', async () => {
    vi.mocked(teamsService.get).mockResolvedValue({ id: 't1', competicao_id: 'c1' } as never);
    vi.mocked(teamsService.update).mockResolvedValue({ id: 't1' } as never);
    const { result } = renderHook(() => useTeam('t1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.team).toBeDefined());
    await act(() => result.current.updateTeam.mutateAsync({ patch: { nome: 'B' }, logo: { kind: 'keep' } }));
    expect(teamsService.update).toHaveBeenCalledWith('t1', 'c1', { nome: 'B' }, { kind: 'keep' });
  });

  it('lists the owner teams', async () => {
    vi.mocked(teamsService.listMine).mockResolvedValue([{ id: 't1' }] as never);
    const { result } = renderHook(() => useMyTeams('d1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.teams).toHaveLength(1));
    expect(teamsService.listMine).toHaveBeenCalledWith('d1');
  });
});
