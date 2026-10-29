import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { AlertGlobal } from '..';

describe('AlertGlobal', () => {
  it('uses role alert for errors', () => {
    renderWithTheme(<AlertGlobal variant="error" message="Falhou" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
  });

  it('uses role status for success', () => {
    renderWithTheme(<AlertGlobal variant="success" message="Salvo" />);
    expect(screen.getByRole('status')).toHaveTextContent('Salvo');
  });

  it('calls onClose', () => {
    const fn = vi.fn();
    renderWithTheme(<AlertGlobal message="Oi" onClose={fn} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
