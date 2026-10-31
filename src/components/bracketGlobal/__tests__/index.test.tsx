import { fireEvent, screen, within } from '@testing-library/react';
import type { IBracketLayout, IBracketMatch } from '@/utils/bracketLayout';
import { renderWithRouter } from '@/utils/testUtils';
import { BracketGlobal } from '..';

const team = (name: string, score: number | null, winner = false) => ({ name, logo: null, score, winner, defined: true });

const final: IBracketMatch = {
  id: 's7',
  code: 'S7',
  phase: 'Final',
  bestOf: 3,
  live: true,
  teamA: team('Okami BC', 1),
  teamB: team('Quixa Rocks', 0),
  games: [
    { id: 'g1', number: 1, home: 'Okami BC', away: 'Quixa Rocks', homeScore: 70, awayScore: 60, status: 'encerrado', startsAt: null },
    { id: 'g2', number: 2, home: 'Quixa Rocks', away: 'Okami BC', homeScore: null, awayScore: null, status: 'pendente', startsAt: null },
  ],
};

const layout: IBracketLayout = { rounds: [], left: [], right: [], finalTitle: 'Final', final, third: null };

describe('BracketGlobal', () => {
  it('opens the games of a series when the matchup is clicked', () => {
    renderWithRouter(<BracketGlobal layout={layout} gameLink={(id) => `/c/liga/jogos/${id}`} />);
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver jogos da série S7: Okami BC x Quixa Rocks' }));
    const dialog = screen.getByRole('dialog', { name: 'Final · S7' });
    expect(within(dialog).getByText('Okami BC 1 x 0 Quixa Rocks')).toBeInTheDocument();
    expect(within(dialog).getByText('70 × 60')).toBeInTheDocument();
    const links = within(dialog).getAllByRole('link', { name: 'Ver jogo →' });
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/c/liga/jogos/g1', '/c/liga/jogos/g2']);
  });
});
