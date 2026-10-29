import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { OrderListGlobal } from '..';

const items = [
  { id: 'a', label: 'Confronto direto' },
  { id: 'b', label: 'Saldo' },
  { id: 'c', label: 'Pontos pró' },
];

describe('OrderListGlobal', () => {
  it('moves items with the arrow buttons', () => {
    const fn = vi.fn();
    renderWithTheme(<OrderListGlobal ariaLabel="Critérios" items={items} onChange={fn} />);
    fireEvent.click(screen.getByRole('button', { name: 'Descer Confronto direto' }));
    expect(fn).toHaveBeenCalledWith(['b', 'a', 'c']);
    fireEvent.click(screen.getByRole('button', { name: 'Subir Pontos pró' }));
    expect(fn).toHaveBeenLastCalledWith(['a', 'c', 'b']);
  });

  it('disables moving past the edges and removes', () => {
    const onRemove = vi.fn();
    renderWithTheme(<OrderListGlobal ariaLabel="Critérios" items={items} onChange={() => {}} onRemove={onRemove} />);
    expect(screen.getByRole('button', { name: 'Subir Confronto direto' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Remover Saldo' }));
    expect(onRemove).toHaveBeenCalledWith('b');
  });
});
