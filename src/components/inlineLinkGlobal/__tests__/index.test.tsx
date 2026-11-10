import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { InlineLinkGlobal } from '..';

describe('InlineLinkGlobal', () => {
  it('renders the text as a link to the route', () => {
    renderWithRouter(<InlineLinkGlobal to="/c/liga/jogadores/j1">Carlos</InlineLinkGlobal>);
    expect(screen.getByRole('link', { name: 'Carlos' })).toHaveAttribute('href', '/c/liga/jogadores/j1');
  });
});
