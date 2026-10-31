import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { BackLinkGlobal } from '..';

describe('BackLinkGlobal', () => {
  it('links back to the given route', () => {
    renderWithRouter(<BackLinkGlobal to="/painel/competicoes" label="Times" />);
    expect(screen.getByRole('link', { name: 'Times' })).toHaveAttribute('href', '/painel/competicoes');
  });
});
