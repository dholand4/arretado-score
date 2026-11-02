import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useLiveGame } from '@/hooks/useLiveGame';
import { renderScreen } from '@/utils/testUtils';
import { ScoreboardScreen } from '..';

vi.mock('@/hooks/useLiveGame');
vi.mock('@/hooks/useWakeLock', () => ({ useWakeLock: vi.fn() }));

const regras = {
  qtd_periodos: 4,
  duracao_periodo_min: 10,
  duracao_prorrogacao_min: 5,
  faltas_bonus_equipe: 4,
  faltas_exclusao_jogador: 5,
  tempos_primeira_metade: 2,
  tempos_segunda_metade: 3,
  tempos_prorrogacao: 1,
  relogio_posse: true,
  posse_segundos: 24,
  posse_reset_curto: 14,
};

const mockJogo = (mesa: unknown) =>
  vi.mocked(useLiveGame).mockReturnValue({
    ctx: {
      jogo: { id: 'j1' },
      competicao: { nome: 'Liga', ...regras },
      casa: { id: 'A', nome: 'Okami BC', logo_url: null },
      fora: { id: 'B', nome: 'QuixaRocks', logo_url: null },
      jogadores: [],
      mesa,
      lances: [],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    relogio: mesa ? { periodo: 3, restanteMs: 90_000, posseMs: 20_000, rodando: true, referenciaMs: 0 } : null,
    jogoMs: 90_000,
    posseMs: 20_000,
    resumo: null,
  } as unknown as ReturnType<typeof useLiveGame>);

const render = () =>
  renderScreen(
    <Routes>
      <Route path="/placar/:gameId" element={<ScoreboardScreen />} />
    </Routes>,
    '/placar/j1',
  );

describe('ScoreboardScreen', () => {
  it('shows the live game in full screen', () => {
    mockJogo({ status: 'em_andamento' });
    render();
    expect(useLiveGame).toHaveBeenCalledWith('j1');
    expect(screen.getByText('AO VIVO')).toBeInTheDocument();
    expect(screen.getByText('3º período')).toBeInTheDocument();
    expect(screen.getByLabelText('Tempo de jogo')).toHaveTextContent('01:30');
    expect(screen.getByText('Okami BC')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tela cheia' })).toBeInTheDocument();
  });

  it('waits for the table to open', () => {
    mockJogo(null);
    render();
    expect(screen.getByText('Em breve')).toBeInTheDocument();
    expect(screen.getByLabelText('Tempo de jogo')).toHaveTextContent('10:00');
  });
});
