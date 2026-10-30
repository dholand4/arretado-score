import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { LeagueHeaderGlobal } from '..';

describe('LeagueHeaderGlobal', () => {
  it('shows the league logo, name and tags', () => {
    const { container } = renderWithTheme(
      <LeagueHeaderGlobal name="Liga Quixadaense" logoUrl="https://example.com/logo.webp" tags={['Basquete', 'Em andamento']} />,
    );
    expect(screen.getByRole('heading', { name: 'Liga Quixadaense' })).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/logo.webp');
    expect(screen.getByText('Basquete')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
  });

  it('uses the initial when there is no logo', () => {
    const { container } = renderWithTheme(<LeagueHeaderGlobal name="Liga" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('L')).toBeInTheDocument();
  });
});
