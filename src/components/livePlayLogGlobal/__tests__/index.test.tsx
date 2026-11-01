import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { LivePlayLogGlobal } from '..';

const item = { periodo: '1º', tempo: '09:12', anulado: false, pendente: false };

describe('LivePlayLogGlobal', () => {
  it('lists plays with their state and voids one', () => {
    const onAnular = vi.fn();
    renderWithTheme(
      <LivePlayLogGlobal
        itens={[
          { ...item, id: 'l2', texto: '+3 #7 Bebeto', pendente: true },
          { ...item, id: 'l1', texto: '+2 #4 Daniel', anulado: true },
        ]}
        onAnular={onAnular}
      />,
    );
    expect(screen.getByText('Enviando')).toBeInTheDocument();
    expect(screen.getByText('Anulado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Anular: +2 #4 Daniel' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Anular: +3 #7 Bebeto' }));
    expect(onAnular).toHaveBeenCalledWith('l2');
  });

  it('shows an empty message', () => {
    renderWithTheme(<LivePlayLogGlobal itens={[]} />);
    expect(screen.getByText('Nenhum lance ainda.')).toBeInTheDocument();
  });
});
