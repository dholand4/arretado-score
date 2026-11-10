import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { IPublicPlayerDetail } from '@/@types/public';
import { usePublicCompetition, usePublicPlayer } from '@/hooks/usePublic';
import { AppError } from '@/utils/appError';
import { renderScreen } from '@/utils/testUtils';
import { PublicPlayerScreen } from '..';

vi.mock('@/hooks/usePublic');

const pontos = { id: 'pts', nome: 'Pontos', sigla: 'PTS', titulo_ranking: 'Cestinha', soma_no_placar: true };
const rebotes = { id: 'reb', nome: 'Rebotes', sigla: 'REB', titulo_ranking: 'Reboteiro', soma_no_placar: false };

const partida = (id: string, inicio: string, placarCasa: number, placarFora: number, vencedor: string) => ({
  id,
  time_casa_id: 't1',
  time_fora_id: 't2',
  casa: { nome: 'Falcões', sigla: 'FAL' },
  fora: { nome: 'Trovão', sigla: 'TRO' },
  placar_casa: placarCasa,
  placar_fora: placarFora,
  vencedor_id: vencedor,
  inicio_previsto: inicio,
  created_at: '2026-10-01T00:00:00Z',
  numero_na_serie: null,
});

const atleta = {
  jogador: {
    id: 'j1',
    time_id: 't1',
    competicao_id: 'c1',
    nome: 'Carlos Silva',
    apelido: 'Carlão',
    numero: 7,
    foto_url: null,
    posicao: 'Ala',
    ativo: true,
  },
  time: { id: 't1', nome: 'Falcões', sigla: 'FAL', logo_url: null },
  jogosDisputados: 2,
  numeros: [
    { categoria: pontos, total: 31, jogos: 2, media: 15.5 },
    { categoria: rebotes, total: 4, jogos: 2, media: 2 },
  ],
  jogos: [
    { jogo: partida('antigo', '2026-11-01T22:00:00Z', 60, 66, 't2'), time_id: 't1', valores: { pts: 9, reb: 4 } },
    { jogo: partida('novo', '2026-11-07T22:00:00Z', 80, 70, 't1'), time_id: 't1', valores: { pts: 22 } },
  ],
} as unknown as IPublicPlayerDetail;

const mockPlayer = (value: Partial<ReturnType<typeof usePublicPlayer>>) =>
  vi.mocked(usePublicPlayer).mockReturnValue({ atleta, isLoading: false, error: null, refetch: vi.fn(), ...value } as ReturnType<
    typeof usePublicPlayer
  >);

const renderPlayer = () =>
  renderScreen(
    <Routes>
      <Route path="/c/:slug/jogadores/:playerId" element={<PublicPlayerScreen />} />
    </Routes>,
    '/c/liga/jogadores/j1',
  );

beforeEach(() => {
  vi.mocked(usePublicCompetition).mockReturnValue({
    competicao: { id: 'c1', slug: 'liga' },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof usePublicCompetition>);
});

describe('PublicPlayerScreen', () => {
  it('shows the header, the totals with averages and the game log, newest first', () => {
    mockPlayer({});
    renderPlayer();
    expect(usePublicPlayer).toHaveBeenCalledWith('j1');
    expect(screen.getByRole('heading', { level: 1, name: 'Carlos Silva' })).toBeInTheDocument();
    expect(screen.getByText('“Carlão” · Falcões')).toBeInTheDocument();
    expect(screen.getByText('Nº 7')).toBeInTheDocument();
    expect(screen.getByText('Ala')).toBeInTheDocument();
    expect(screen.queryByText('Inativo')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver Falcões' })).toHaveAttribute('href', '/c/liga/times/t1');

    const numeros = within(screen.getByRole('heading', { name: 'Números na competição' }).parentElement as HTMLElement);
    expect(numeros.getByText('Jogos').nextElementSibling).toHaveTextContent('2');
    expect(numeros.getByText('Pontos').nextElementSibling).toHaveTextContent('31');
    expect(numeros.getByText('15,5 por jogo')).toBeInTheDocument();
    expect(numeros.getByText('2,0 por jogo')).toBeInTheDocument();

    const links = screen.getAllByRole('link', { name: 'x Trovão' });
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/c/liga/jogos/novo', '/c/liga/jogos/antigo']);
    expect(screen.getByText('Vitória')).toBeInTheDocument();
    expect(screen.getByText('Derrota')).toBeInTheDocument();
  });

  it('marks an inactive player and explains when there are no numbers yet', () => {
    mockPlayer({
      atleta: {
        ...atleta,
        jogador: { ...atleta.jogador, apelido: null, numero: null, posicao: null, ativo: false },
        jogosDisputados: 0,
        numeros: [{ categoria: pontos, total: 0, jogos: 0, media: 0 }],
        jogos: [],
      } as IPublicPlayerDetail,
    });
    renderPlayer();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
    expect(screen.getByText('Falcões')).toBeInTheDocument();
    expect(screen.queryByText(/^Nº/)).not.toBeInTheDocument();
    expect(screen.getByText('Ainda sem números')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Jogo a jogo' })).not.toBeInTheDocument();
  });

  it('shows loading and the not found error', () => {
    mockPlayer({ atleta: undefined, isLoading: true });
    const { unmount } = renderPlayer();
    expect(screen.getByText('Carregando jogador')).toBeInTheDocument();
    unmount();

    mockPlayer({ atleta: undefined, error: new AppError('Jogador não encontrado.') });
    renderPlayer();
    expect(screen.getByText('Jogador não encontrado.')).toBeInTheDocument();
  });

  it('does not show a player of another league under this league address', () => {
    mockPlayer({ atleta: { ...atleta, jogador: { ...atleta.jogador, competicao_id: 'outra' } } as IPublicPlayerDetail });
    renderPlayer();
    expect(screen.queryByRole('heading', { level: 1, name: 'Carlos Silva' })).not.toBeInTheDocument();
    expect(screen.getByText('Jogador não encontrado.')).toBeInTheDocument();
  });
});
