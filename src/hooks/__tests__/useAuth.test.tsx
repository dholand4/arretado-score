import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/providers/AuthProvider';
import { authService } from '@/services/authService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/authService');

const session = { user: { id: 'u1' } } as unknown as Awaited<ReturnType<typeof authService.signIn>>;
const profile = (overrides = {}) => ({
  id: 'u1',
  nome: 'Ana',
  papel: 'admin' as const,
  ativo: true,
  precisa_trocar_senha: true,
  telefone: null,
  created_at: '2026-10-01T00:00:00Z',
  ...overrides,
});

function setup() {
  const QueryWrapper = createQueryWrapper();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryWrapper>
      <AuthProvider>{children}</AuthProvider>
    </QueryWrapper>
  );
  return renderHook(() => useAuth(), { wrapper });
}

beforeEach(() => {
  vi.mocked(authService.getSession).mockResolvedValue(null);
  vi.mocked(authService.onAuthStateChange).mockReturnValue(() => {});
  vi.mocked(authService.signOut).mockResolvedValue();
});

describe('useAuth', () => {
  it('throws outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });

  it('starts signed out without session', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
  });

  it('loads profile of an existing session', async () => {
    vi.mocked(authService.getSession).mockResolvedValue(session);
    vi.mocked(authService.getProfile).mockResolvedValue(profile());
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    expect(result.current.profile?.precisa_trocar_senha).toBe(true);
  });

  it('rejects sign in of a deactivated user and signs out', async () => {
    vi.mocked(authService.signIn).mockResolvedValue(session);
    vi.mocked(authService.getProfile).mockResolvedValue(profile({ ativo: false }));
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    await expect(
      act(() => result.current.signIn({ email: 'a@b.com', password: '12345678' })),
    ).rejects.toThrow('Usuário desativado');
    expect(authService.signOut).toHaveBeenCalled();
  });
});
