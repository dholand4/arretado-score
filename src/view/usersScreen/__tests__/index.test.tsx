import { fireEvent, screen, within } from '@testing-library/react';
import type { IUsuarioListado } from '@/@types/user';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { renderScreen } from '@/utils/testUtils';
import { UsersScreen } from '..';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useUsers');

const user = (overrides: Partial<IUsuarioListado>): IUsuarioListado => ({
  id: 'u1',
  nome: 'Fulano',
  email: 'fulano@x.com',
  papel: 'admin',
  ativo: true,
  precisa_trocar_senha: false,
  created_at: '2026-10-01T00:00:00Z',
  ultimo_acesso: null,
  ...overrides,
});

const mutation = () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null });

function mockUsers(overrides: Partial<ReturnType<typeof useUsers>> = {}) {
  const value = {
    users: [
      user({ id: 'm', nome: 'Master', email: 'master@x.com', papel: 'master' }),
      user({ id: 'a', nome: 'Ana Admin', email: 'ana@x.com', papel: 'admin', precisa_trocar_senha: true }),
      user({ id: 'd', nome: 'Davi Dono', email: 'davi@x.com', papel: 'dono_time', ativo: false }),
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    createUser: mutation(),
    updateUser: mutation(),
    resetPassword: mutation(),
    ...overrides,
  };
  vi.mocked(useUsers).mockReturnValue(value as unknown as ReturnType<typeof useUsers>);
  return value;
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'm' } } as unknown as ReturnType<typeof useAuth>);
});

describe('UsersScreen', () => {
  it('shows loader while loading', () => {
    mockUsers({ isLoading: true, users: [] });
    renderScreen(<UsersScreen />);
    expect(screen.getByRole('status', { name: 'Carregando usuários' })).toBeInTheDocument();
  });

  it('lists users with status badges and hides deactivate for self', () => {
    mockUsers();
    renderScreen(<UsersScreen />);
    const list = screen.getByRole('list', { name: 'Usuários' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Troca de senha pendente')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
    const selfCard = screen.getByText('Master (você)').closest('li') as HTMLElement;
    expect(within(selfCard).queryByRole('button', { name: 'Desativar' })).not.toBeInTheDocument();
  });

  it('filters by search text', () => {
    mockUsers();
    renderScreen(<UsersScreen />);
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'davi' } });
    expect(within(screen.getByRole('list', { name: 'Usuários' })).getAllByRole('listitem')).toHaveLength(1);
  });

  it('creates a user through the modal', () => {
    const { createUser } = mockUsers();
    renderScreen(<UsersScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Novo usuário' }));
    const dialog = screen.getByRole('dialog', { name: 'Novo usuário' });
    fireEvent.change(within(dialog).getByLabelText('Nome'), { target: { value: 'Novo Admin' } });
    fireEvent.change(within(dialog).getByLabelText('E-mail'), { target: { value: 'novo@x.com' } });
    fireEvent.change(within(dialog).getByLabelText('Senha provisória'), { target: { value: 'Provisoria1' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar usuário' }));
    expect(createUser.mutate).toHaveBeenCalledWith(
      { nome: 'Novo Admin', email: 'novo@x.com', senha: 'Provisoria1', papel: 'admin' },
      expect.any(Object),
    );
  });

  it('deactivates a user after confirmation', () => {
    const { updateUser } = mockUsers();
    renderScreen(<UsersScreen />);
    const card = screen.getByText('Ana Admin').closest('li') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: 'Desativar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar' }));
    expect(updateUser.mutate).toHaveBeenCalledWith({ id: 'a', ativo: false }, expect.any(Object));
  });
});
