import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { CompetitionStartGlobal } from '..';

describe('CompetitionStartGlobal', () => {
  it('starts when nothing blocks it', () => {
    const onStart = vi.fn();
    renderWithTheme(<CompetitionStartGlobal steps={[{ kind: 'fase', label: 'Fase 1: 5 times' }]} blockers={[]} onStart={onStart} />);
    expect(screen.getByText('Fase 1: 5 times')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar competição' }));
    expect(onStart).toHaveBeenCalled();
  });

  it('lists the blockers and disables the button', () => {
    renderWithTheme(<CompetitionStartGlobal steps={[]} blockers={['Cadastre ao menos 2 times.']} onStart={vi.fn()} />);
    expect(screen.getByText('Cadastre ao menos 2 times.')).toBeInTheDocument();
    expect(screen.getByText('Configure as fases para ver o formato.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar competição' })).toBeDisabled();
  });
});
