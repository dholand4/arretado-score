import { act, renderHook, waitFor } from '@testing-library/react';
import { useCompetitionAdmins, useDonos } from '@/hooks/useCompetitionAdmins';
import { competitionsService, peopleService } from '@/services/competitionsService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/competitionsService');

describe('useCompetitionAdmins', () => {
  it('adds an admin to the competition', async () => {
    vi.mocked(competitionsService.listAdmins).mockResolvedValue([]);
    vi.mocked(competitionsService.addAdmin).mockResolvedValue();
    const { result } = renderHook(() => useCompetitionAdmins('c1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => result.current.addAdmin.mutateAsync('a2'));
    expect(competitionsService.addAdmin).toHaveBeenCalledWith('c1', 'a2');
  });

  it('only loads donos when enabled', async () => {
    vi.mocked(peopleService.listDonos).mockResolvedValue([{ id: 'd', nome: 'Davi' }]);
    const { result, rerender } = renderHook(({ on }) => useDonos(on), {
      wrapper: createQueryWrapper(),
      initialProps: { on: false },
    });
    expect(peopleService.listDonos).not.toHaveBeenCalled();
    rerender({ on: true });
    await waitFor(() => expect(result.current.donos).toHaveLength(1));
  });
});
