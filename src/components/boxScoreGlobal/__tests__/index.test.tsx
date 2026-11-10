import { screen } from '@testing-library/react';
import type { IPublicCategory, IPublicPlayer } from '@/@types/public';
import { renderWithRouter } from '@/utils/testUtils';
import { BoxScoreGlobal } from '..';

const categorias = [{ id: 'pts', nome: 'Pontos', sigla: 'PTS', titulo_ranking: 'Cestinha', soma_no_placar: true }] as IPublicCategory[];
const jogadores: IPublicPlayer[] = [
  { id: 'j1', time_id: 't1', nome: 'Carlos Silva', apelido: 'Carlão', numero: 7, foto_url: null },
  { id: 'j2', time_id: 't1', nome: 'Bruno', apelido: null, numero: null, foto_url: null },
];

describe('BoxScoreGlobal', () => {
  it('shows the team score and each player numbers', () => {
    renderWithRouter(
      <BoxScoreGlobal teamName="Falcões" score={80} players={jogadores} categories={categorias} stats={{ j1: { pts: 22 } }} />,
    );
    expect(screen.getByRole('region', { name: 'Estatísticas de Falcões' })).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('Carlão')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links each player to the player page when a href is given', () => {
    renderWithRouter(
      <BoxScoreGlobal
        teamName="Falcões"
        score={80}
        players={jogadores}
        categories={categorias}
        stats={{}}
        playerHref={(id) => `/c/liga/jogadores/${id}`}
      />,
    );
    expect(screen.getByRole('link', { name: 'Carlão' })).toHaveAttribute('href', '/c/liga/jogadores/j1');
    expect(screen.getByRole('link', { name: 'Bruno' })).toHaveAttribute('href', '/c/liga/jogadores/j2');
  });
});
