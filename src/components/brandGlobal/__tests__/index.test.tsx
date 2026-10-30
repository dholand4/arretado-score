import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { BrandGlobal } from '..';

describe('BrandGlobal', () => {
  it('links to the given route', () => {
    renderWithRouter(<BrandGlobal to="/painel" />);
    expect(screen.getByRole('link', { name: 'Arretado Score — início' })).toHaveAttribute('href', '/painel');
  });
});
