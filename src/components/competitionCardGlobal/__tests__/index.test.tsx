import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { CompetitionCardGlobal } from '..';

describe('CompetitionCardGlobal', () => {
  it('renders name, modalidade and status as a link', () => {
    renderWithRouter(
      <CompetitionCardGlobal nome="Liga" modalidade="basquete" status="rascunho" meta="5 times" to="/painel/competicoes/1" />,
    );
    const link = screen.getByRole('link', { name: /Liga/ });
    expect(link).toHaveAttribute('href', '/painel/competicoes/1');
    expect(screen.getByText('Basquete')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('5 times')).toBeInTheDocument();
  });
});
