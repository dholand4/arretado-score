import { screen } from '@testing-library/react';
import { renderScreen } from '@/utils/testUtils';
import { ScoreSheetScreen } from '..';

describe('ScoreSheetScreen', () => {
  it('renders the placeholder', () => {
    renderScreen(<ScoreSheetScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'Súmula' })).toBeInTheDocument();
  });
});
