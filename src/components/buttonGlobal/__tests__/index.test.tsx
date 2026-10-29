import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { ButtonGlobal } from '..';

describe('ButtonGlobal', () => {
  it('renders label', () => {
    renderWithTheme(<ButtonGlobal label="OK" onClick={() => {}} />);
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });

  it('fires onClick', () => {
    const fn = vi.fn();
    renderWithTheme(<ButtonGlobal label="OK" onClick={fn} />);
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('blocks click when disabled', () => {
    const fn = vi.fn();
    renderWithTheme(<ButtonGlobal label="OK" onClick={fn} disabled />);
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(fn).not.toHaveBeenCalled();
  });

  it('is disabled and busy while loading', () => {
    renderWithTheme(<ButtonGlobal label="Salvar" loading />);
    const button = screen.getByRole('button', { name: /Salvar/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
