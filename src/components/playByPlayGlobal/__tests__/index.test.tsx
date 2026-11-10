import { fireEvent, screen, within } from '@testing-library/react';
import type { ILivePlayItem } from '@/components/livePlayLogGlobal';
import { renderWithTheme } from '@/utils/testUtils';
import { PlayByPlayGlobal } from '..';

const item = (id: string, periodo: string, texto: string): ILivePlayItem => ({
  id,
  periodo,
  tempo: '05:00',
  texto,
  anulado: false,
  pendente: false,
});

// Do mais recente para o mais antigo, como a mesa entrega.
const itens = [item('l3', '2º', '+3 #9 Bruno'), item('l2', '1º', 'Pessoal — #7 Carlão'), item('l1', '1º', '+2 #7 Carlão')];

describe('PlayByPlayGlobal', () => {
  it('lists every play and filters by period, in game order', () => {
    renderWithTheme(<PlayByPlayGlobal itens={itens} />);
    const lances = () => within(screen.getByRole('list', { name: 'Lances' })).getAllByRole('listitem');
    expect(lances()).toHaveLength(3);
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['Todos', '1º', '2º']);

    fireEvent.click(screen.getByRole('radio', { name: '1º' }));
    expect(lances().map((l) => l.textContent)).toEqual(['1º 05:00Pessoal — #7 Carlão', '1º 05:00+2 #7 Carlão']);

    fireEvent.click(screen.getByRole('radio', { name: 'Todos' }));
    expect(lances()).toHaveLength(3);
    // Página pública: ninguém anula lance por aqui.
    expect(screen.queryByRole('button', { name: /Anular/ })).not.toBeInTheDocument();
  });

  it('hides the period filter in a single-period log and shows the note', () => {
    renderWithTheme(<PlayByPlayGlobal itens={itens.slice(1)} note="O placar foi corrigido." />);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByText('O placar foi corrigido.')).toBeInTheDocument();
  });
});
