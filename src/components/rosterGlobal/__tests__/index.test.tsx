import { fireEvent, screen, within } from '@testing-library/react';
import type { IJogador } from '@/@types/competition';
import { renderWithTheme } from '@/utils/testUtils';
import { RosterGlobal } from '..';

const players = [
  { id: '1', nome: 'Carlos', apelido: 'Cacá', numero: 4, posicao: 'Armador', ativo: true, foto_url: null },
  { id: '2', nome: 'Pedro', apelido: null, numero: 15, posicao: null, ativo: false, foto_url: null },
] as IJogador[];

const handlers = () => ({ onAdd: vi.fn(), onEdit: vi.fn(), onToggleActive: vi.fn(), onDelete: vi.fn() });

describe('RosterGlobal', () => {
  it('lists players with counts and status', () => {
    renderWithTheme(<RosterGlobal players={players} {...handlers()} />);
    expect(screen.getByText(/1 jogador ativo · 1 inativo/)).toBeInTheDocument();
    expect(screen.getByText('“Cacá” · Armador')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('only shows delete when allowed', () => {
    const h = handlers();
    const { rerender } = renderWithTheme(<RosterGlobal players={players} {...h} />);
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
    rerender(<RosterGlobal players={players} canDelete {...h} />);
    const row = screen.getByText('Pedro').closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Excluir' }));
    expect(h.onDelete).toHaveBeenCalledWith(players[1]);
  });

  it('shows empty state', () => {
    renderWithTheme(<RosterGlobal players={[]} {...handlers()} />);
    expect(screen.getByText('Elenco vazio')).toBeInTheDocument();
  });
});
