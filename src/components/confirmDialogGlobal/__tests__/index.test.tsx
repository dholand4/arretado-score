import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { ConfirmDialogGlobal } from '..';

const base = { open: true, title: 'Desativar', message: 'Tem certeza?', confirmLabel: 'Desativar' };

describe('ConfirmDialogGlobal', () => {
  it('confirms and cancels', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderWithTheme(<ConfirmDialogGlobal {...base} onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Desativar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error', () => {
    renderWithTheme(<ConfirmDialogGlobal {...base} error="Falhou" onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
  });
});
