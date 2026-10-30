import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { ScoreboardGlobal } from '..';

describe('ScoreboardGlobal', () => {
  it('announces the score', () => {
    renderWithTheme(<ScoreboardGlobal home="Falcões" away="Trovão" homeScore="45" awayScore="40" subtitle="Rodada 1" />);
    expect(screen.getByRole('status', { name: 'Placar: Falcões 45 x 40 Trovão' })).toBeInTheDocument();
    expect(screen.getByText('Rodada 1')).toBeInTheDocument();
  });
});
