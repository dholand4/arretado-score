import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { InputGlobal } from '..';

describe('InputGlobal', () => {
  it('associates label and input', () => {
    renderWithTheme(<InputGlobal label="E-mail" />);
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it('fires onChange', () => {
    const fn = vi.fn();
    renderWithTheme(<InputGlobal label="Nome" onChange={fn} />);
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana' } });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('shows error and marks invalid', () => {
    renderWithTheme(<InputGlobal label="Senha" error="Obrigatório" hint="dica" />);
    expect(screen.getByText('Obrigatório')).toBeInTheDocument();
    expect(screen.queryByText('dica')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true');
  });
});
