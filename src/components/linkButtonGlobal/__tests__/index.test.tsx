import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { LinkButtonGlobal } from '..';

describe('LinkButtonGlobal', () => {
  it('renders a link to the route', () => {
    renderWithRouter(<LinkButtonGlobal to="/painel/competicoes" label="Competições" />);
    expect(screen.getByRole('link', { name: 'Competições' })).toHaveAttribute('href', '/painel/competicoes');
  });
});
