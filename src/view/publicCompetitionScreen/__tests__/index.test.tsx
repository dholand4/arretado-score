import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { IJogoLista } from '@/@types/game';
import { usePublicCompetition, usePublicGames, useRanking } from '@/hooks/usePublic';
import { renderScreen } from '@/utils/testUtils';
import { PublicCompetitionScreen } from '..';

vi.mock('@/hooks/usePublic');

const jogo = (id: string, ordem: number, casa: string, fora: string, hora: string): IJogoLista =>
  ({
    id,
    evento_id: 'dia1',
    ordem_no_evento: ordem,
    status: 'agendado',
    time_casa_id: casa,
    time_fora_id: fora,
    casa: { nome: casa, sigla: null },
    fora: { nome: fora, sigla: null },
    placar_casa: null,
    placar_fora: null,
    rodada: 4 - ordem,
    fase: { nome: 'Fase de Chaveamento' },
    grupo: null,
    serie: null,
    inicio_previsto: `2099-10-31T${hora}:00:00Z`,
    evento: { data: '2099-10-31', local: 'Ginásio', status: 'publicado' },
  }) as unknown as IJogoLista;

beforeEach(() => {
  vi.mocked(usePublicCompetition).mockReturnValue({ competicao: { id: 'c1', descricao: null } } as unknown as ReturnType<
    typeof usePublicCompetition
  >);
  vi.mocked(useRanking).mockReturnValue({ ranking: undefined } as unknown as ReturnType<typeof useRanking>);
  vi.mocked(usePublicGames).mockReturnValue({
    jogos: [
      jogo('j1', 1, 'Estadual', 'QuixaRocks', '15'),
      jogo('j2', 2, 'Okami BC', 'QuixaRocks', '16'),
      jogo('j3', 3, 'Estadual', 'Okami BC', '17'),
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof usePublicGames>);
});

describe('PublicCompetitionScreen', () => {
  it('shows the games of the day that depend on the first result', () => {
    renderScreen(
      <Routes>
        <Route path="/c/:slug" element={<PublicCompetitionScreen />} />
      </Routes>,
      '/c/liga',
    );
    // O primeiro jogo continua com os nomes; os dois seguintes dependem do resultado dele.
    expect(screen.getByText('Estadual')).toBeInTheDocument();
    expect(screen.getAllByText('Perdedor Jogo 1')).toHaveLength(1);
    expect(screen.getAllByText('Vencedor Jogo 1')).toHaveLength(1);
    expect(screen.getAllByText('Okami BC')).toHaveLength(2);
    expect(['Jogo 1', 'Jogo 2', 'Jogo 3'].map((n) => screen.getByText(n))).toHaveLength(3);
    // A rodada dos confrontos condicionais só se define depois do resultado.
    expect(screen.getByText(/Rodada 3/)).toBeInTheDocument();
    expect(screen.queryByText(/Rodada 2/)).not.toBeInTheDocument();
  });
});
