import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { ResetPasswordModalGlobal } from '..';

const base = { open: true, userName: 'Ana', onClose: () => {}, onGeneratePassword: () => 'Nova12345' };

describe('ResetPasswordModalGlobal', () => {
  it('rejects short password', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<ResetPasswordModalGlobal {...base} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Nova senha provisória'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Redefinir' }));
    expect(screen.getByText(/Mínimo de 8/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits generated password', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<ResetPasswordModalGlobal {...base} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Redefinir' }));
    expect(onSubmit).toHaveBeenCalledWith('Nova12345');
  });
});
