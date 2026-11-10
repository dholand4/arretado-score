import { screen } from '@testing-library/react';
import type { IRankingRow } from '@/@types/public';
import { renderWithRouter } from '@/utils/testUtils';
import { RankingTableGlobal } from '..';

const linha = (id: string, nome: string, total: number, media: number): IRankingRow => ({
  categoria_id: 'pts',
  jogador_id: id,
  time_id: 't1',
  total,
  jogos: 2,
  media,
  jogador: { id, time_id: 't1', nome, apelido: null, numero: 7, foto_url: null },
  timeNome: 'Falcões',
});

const linhas = [linha('j1', 'Carlos', 40, 20), linha('j2', 'Bruno', 25, 12.5)];

describe('RankingTableGlobal', () => {
  it('shows position, player, team, total, games and average', () => {
    renderWithRouter(<RankingTableGlobal rows={linhas} caption="Cestinha" />);
    expect(screen.getByText('Cestinha')).toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('1º')).toBeInTheDocument();
    expect(screen.getByText('12,5')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links each name to the player page when a href is given', () => {
    renderWithRouter(<RankingTableGlobal rows={linhas} playerHref={(id) => `/c/liga/jogadores/${id}`} />);
    expect(screen.getByRole('link', { name: 'Carlos' })).toHaveAttribute('href', '/c/liga/jogadores/j1');
    expect(screen.getByRole('link', { name: 'Bruno' })).toHaveAttribute('href', '/c/liga/jogadores/j2');
  });

  it('keeps the real position when filtering and respects the limit', () => {
    renderWithRouter(<RankingTableGlobal rows={linhas} query="bruno" />);
    expect(screen.queryByText('Carlos')).not.toBeInTheDocument();
    expect(screen.getByText('2º')).toBeInTheDocument();
  });
});
