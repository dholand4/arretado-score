import { screen } from '@testing-library/react';
import { renderScreen } from '@/utils/testUtils';
import { PublicStandingsScreen } from '..';

describe('PublicStandingsScreen', () => {
  it('renders the placeholder', () => {
    renderScreen(<PublicStandingsScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tabela' })).toBeInTheDocument();
  });
});
