import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { DoubleGameDialogGlobal } from '..';

describe('DoubleGameDialogGlobal', () => {
  it('asks before allowing a double game', () => {
    const onAllowDouble = vi.fn();
    const onLimit = vi.fn();
    renderWithTheme(
      <DoubleGameDialogGlobal
        open
        message="Só é possível montar 2 jogos sem repetir time. Deseja permitir jogo duplo?"
        maxWithoutRepeat={2}
        onAllowDouble={onAllowDouble}
        onLimit={onLimit}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Só é possível montar 2 jogos sem repetir time/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Montar só 2 jogos' }));
    expect(onLimit).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Permitir jogo duplo' }));
    expect(onAllowDouble).toHaveBeenCalled();
  });

  it('hides the limit option when no game fits', () => {
    renderWithTheme(
      <DoubleGameDialogGlobal open message="x" maxWithoutRepeat={0} onAllowDouble={vi.fn()} onLimit={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: /Montar só/ })).not.toBeInTheDocument();
  });
});
