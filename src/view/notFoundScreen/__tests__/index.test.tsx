import { screen } from '@testing-library/react';
import { renderScreen } from '@/utils/testUtils';
import { NotFoundScreen } from '..';

describe('NotFoundScreen', () => {
  it('links back to home', () => {
    renderScreen(<NotFoundScreen />);
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/');
  });
});
