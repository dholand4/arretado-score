import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { UserFormModalGlobal } from '..';

const base = { open: true, onClose: () => {}, onGeneratePassword: () => 'Gerada123' };

describe('UserFormModalGlobal', () => {
  it('validates required fields on create', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<UserFormModalGlobal {...base} mode="create" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuário' }));
    expect(screen.getByText('Informe o nome.')).toBeInTheDocument();
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits normalized values with generated password', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<UserFormModalGlobal {...base} mode="create" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: ' Ana ' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ANA@x.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gerar' }));
    fireEvent.change(screen.getByLabelText('Papel'), { target: { value: 'dono_time' } });
    fireEvent.change(screen.getByLabelText('Telefone / WhatsApp'), { target: { value: '(88) 99999-1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuário' }));
    expect(onSubmit).toHaveBeenCalledWith({
      nome: 'Ana',
      email: 'ana@x.com',
      senha: 'Gerada123',
      papel: 'dono_time',
      telefone: '88999991234',
    });
  });

  it('edit mode hides password and locks email', () => {
    renderWithTheme(
      <UserFormModalGlobal
        {...base}
        mode="edit"
        initialValues={{ nome: 'Bia', email: 'bia@x.com', papel: 'admin' }}
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Senha provisória')).not.toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeDisabled();
  });
});
