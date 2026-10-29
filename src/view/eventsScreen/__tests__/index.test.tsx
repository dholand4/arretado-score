import { screen } from '@testing-library/react';
import { renderScreen } from '@/utils/testUtils';
import { EventsScreen } from '..';

describe('EventsScreen', () => {
  it('renders the placeholder', () => {
    renderScreen(<EventsScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dias de jogos' })).toBeInTheDocument();
  });
});
