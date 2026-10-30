import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { GameCardGlobal } from '..';

describe('GameCardGlobal', () => {
  it('links to the score sheet and shows score, status and details', () => {
    renderWithRouter(
      <GameCardGlobal
        to="/painel/competicoes/c1/jogos/j1/sumula"
        home="Falcões"
        away="Trovão"
        homeScore={80}
        awayScore={70}
        statusLabel="Encerrado"
        statusTone="success"
        description="Rodada 1 · 25/10/2026 19:00"
        actionLabel="Editar súmula"
      />,
    );
    expect(screen.getByRole('link', { name: /Falcões/ })).toHaveAttribute('href', '/painel/competicoes/c1/jogos/j1/sumula');
    expect(screen.getByText('80 × 70')).toBeInTheDocument();
    expect(screen.getByText('Encerrado')).toBeInTheDocument();
    expect(screen.getByText('Editar súmula →')).toBeInTheDocument();
  });
});
