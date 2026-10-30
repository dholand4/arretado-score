import { act, renderHook, waitFor } from '@testing-library/react';
import { useUsers } from '@/hooks/useUsers';
import { usersService } from '@/services/usersService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/usersService');

describe('useUsers', () => {
  it('loads the user list', async () => {
    vi.mocked(usersService.list).mockResolvedValue([
      {
        id: 'u1',
        nome: 'Ana',
        email: 'ana@x.com',
        papel: 'admin',
        ativo: true,
        precisa_trocar_senha: false,
        telefone: null,
        created_at: '2026-10-01T00:00:00Z',
        ultimo_acesso: null,
      },
    ]);
    const { result } = renderHook(() => useUsers(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.users).toHaveLength(1);
  });

  it('refetches the list after creating a user', async () => {
    vi.mocked(usersService.list).mockResolvedValue([]);
    vi.mocked(usersService.create).mockResolvedValue({} as Awaited<ReturnType<typeof usersService.create>>);
    const { result } = renderHook(() => useUsers(), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const callsBefore = vi.mocked(usersService.list).mock.calls.length;
    await act(() =>
      result.current.createUser.mutateAsync({ nome: 'B', email: 'b@x.com', senha: '12345678', papel: 'admin' }),
    );
    await waitFor(() => expect(vi.mocked(usersService.list).mock.calls.length).toBeGreaterThan(callsBefore));
  });
});
