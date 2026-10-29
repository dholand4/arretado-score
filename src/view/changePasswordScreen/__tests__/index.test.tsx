import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { renderScreen } from '@/utils/testUtils';
import { ChangePasswordScreen } from '..';

vi.mock('@/hooks/useAuth');

const changePassword = vi.fn();

function mockAuth(precisa: boolean) {
  vi.mocked(useAuth).mockReturnValue({
    profile: { nome: 'Ana', precisa_trocar_senha: precisa },
    changePassword,
    signOut: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>);
}

function fill(senha: string, confirmacao: string) {
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: senha } });
  fireEvent.change(screen.getByLabelText('Confirme a nova senha'), { target: { value: confirmacao } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
}

beforeEach(() => changePassword.mockReset());

describe('ChangePasswordScreen', () => {
  it('warns when the change is mandatory', () => {
    mockAuth(true);
    renderScreen(<ChangePasswordScreen />);
    expect(screen.getByText(/defina uma nova senha antes de continuar/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('rejects mismatched passwords', () => {
    mockAuth(true);
    renderScreen(<ChangePasswordScreen />);
    fill('novaSenha1', 'outraSenha');
    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('submits a valid new password', async () => {
    mockAuth(false);
    changePassword.mockResolvedValue(undefined);
    renderScreen(<ChangePasswordScreen />);
    fill('novaSenha1', 'novaSenha1');
    await waitFor(() => expect(changePassword).toHaveBeenCalledWith('novaSenha1'));
  });
});
