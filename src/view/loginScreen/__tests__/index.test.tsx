import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { AppError } from '@/utils/appError';
import { renderScreen } from '@/utils/testUtils';
import { LoginScreen } from '..';

vi.mock('@/hooks/useAuth');

const signIn = vi.fn();

beforeEach(() => {
  signIn.mockReset();
  vi.mocked(useAuth).mockReturnValue({
    signIn,
    notice: null,
    clearNotice: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>);
});

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginScreen', () => {
  it('validates empty fields', () => {
    renderScreen(<LoginScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe e-mail e senha.');
    expect(signIn).not.toHaveBeenCalled();
  });

  it('calls signIn with credentials', async () => {
    signIn.mockResolvedValue(undefined);
    renderScreen(<LoginScreen />);
    fill('ana@x.com', 'segredo123');
    await waitFor(() => expect(signIn).toHaveBeenCalledWith({ email: 'ana@x.com', password: 'segredo123' }));
  });

  it('shows the error returned by signIn', async () => {
    signIn.mockRejectedValue(new AppError('Usuário desativado. Fale com o administrador.'));
    renderScreen(<LoginScreen />);
    fill('ana@x.com', 'segredo123');
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário desativado');
  });
});
