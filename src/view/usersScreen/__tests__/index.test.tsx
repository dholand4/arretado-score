import { fireEvent, screen, within } from '@testing-library/react';
import type { IUsuarioListado } from '@/@types/user';
import { useAuth } from '@/hooks/useAuth';
import { useUserLeagues, useUsers } from '@/hooks/useUsers';
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
  telefone: null,
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

const chooseLeague = (label: string) =>
  fireEvent.change(screen.getByLabelText('Liga'), {
    target: { value: within(screen.getByLabelText('Liga')).getByRole('option', { name: label }).getAttribute('value') },
  });

beforeEach(() => {
  vi.mocked(useUserLeagues).mockReturnValue({
    ligas: [
      { id: 'l1', nome: 'Liga Quixadá', usuarios: ['d', 'm', 'a'] },
      { id: 'l2', nome: 'Liga Vazia', usuarios: [] },
    ],
    isLoading: false,
  });
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'm', papel: 'master' } } as unknown as ReturnType<typeof useAuth>);
});

describe('UsersScreen', () => {
  it('shows loader while loading', () => {
    mockUsers({ isLoading: true, users: [] });
    renderScreen(<UsersScreen />);
    expect(screen.getByRole('status', { name: 'Carregando usuários' })).toBeInTheDocument();
  });

  it('shows only the masters until a league is chosen', () => {
    mockUsers();
    renderScreen(<UsersScreen />);
    const list = screen.getByRole('list', { name: 'Usuários' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(within(list).getByText('Master (você)')).toBeInTheDocument();
    expect(screen.getByText(/1 master\(s\), com acesso a todas as ligas/)).toBeInTheDocument();
  });

  it('shows only the users of the chosen league', () => {
    mockUsers();
    renderScreen(<UsersScreen />);
    chooseLeague('Liga Quixadá');
    const list = screen.getByRole('list', { name: 'Usuários' });
    // O master que criou a liga fica de fora; coordenador antes do login do time.
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('Ana Admin')).toBeInTheDocument();
    expect(within(cards[1]).getByText('Davi Dono')).toBeInTheDocument();
    expect(within(list).queryByText('Master (você)')).not.toBeInTheDocument();
    expect(screen.getByText('2 de 2 usuário(s)')).toBeInTheDocument();
    chooseLeague('Liga Vazia');
    expect(screen.getByText('Nenhum coordenador ou responsável de time nesta liga.')).toBeInTheDocument();
  });

  it('lists users with status badges and hides deactivate for self', () => {
    mockUsers();
    renderScreen(<UsersScreen />);
    chooseLeague('Todas as ligas');
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
    chooseLeague('Todas as ligas');
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
      { nome: 'Novo Admin', email: 'novo@x.com', senha: 'Provisoria1', papel: 'admin', telefone: '' },
      expect.any(Object),
    );
  });

  it('deactivates a user after confirmation', () => {
    const { updateUser } = mockUsers();
    renderScreen(<UsersScreen />);
    chooseLeague('Todas as ligas');
    const card = screen.getByText('Ana Admin').closest('li') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: 'Desativar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar' }));
    expect(updateUser.mutate).toHaveBeenCalledWith({ id: 'a', ativo: false }, expect.any(Object));
  });

  describe('as a coordinator', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({ profile: { id: 'a', papel: 'admin' } } as unknown as ReturnType<typeof useAuth>);
    });

    it('lists the team logins of its leagues right away', () => {
      // listar_usuarios já devolve só as equipes que o coordenador enxerga.
      mockUsers({ users: [user({ id: 'd', nome: 'Davi Dono', papel: 'dono_time' })] });
      renderScreen(<UsersScreen />);
      const list = screen.getByRole('list', { name: 'Usuários' });
      expect(within(list).getAllByRole('listitem')).toHaveLength(1);
      const options = within(screen.getByLabelText('Liga')).getAllByRole('option').map((o) => o.textContent);
      expect(options).toEqual(['Todas as minhas ligas', 'Liga Quixadá']);
      expect(screen.queryByLabelText('Papel')).not.toBeInTheDocument();
    });

    it('only resets passwords', () => {
      const { resetPassword } = mockUsers({ users: [user({ id: 'd', nome: 'Davi Dono', papel: 'dono_time' })] });
      renderScreen(<UsersScreen />);
      expect(screen.queryByRole('button', { name: 'Novo usuário' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Desativar' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(resetPassword.reset).toHaveBeenCalled();
    });
  });
});
