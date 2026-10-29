import { screen } from '@testing-library/react';
import { renderScreen } from '@/utils/testUtils';
import { GamesScreen } from '..';

describe('GamesScreen', () => {
  it('renders the placeholder', () => {
    renderScreen(<GamesScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'Jogos' })).toBeInTheDocument();
  });
});
