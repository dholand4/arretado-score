import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useMesaByToken } from '@/hooks/useMesaLink';
import { renderScreen } from '@/utils/testUtils';
import { MesaLinkScreen } from '..';

vi.mock('@/hooks/useMesaLink');
vi.mock('@/view/liveScoreSheetScreen', () => ({
  LiveSheetView: ({ competitionId, gameId, token }: { competitionId: string; gameId: string; token: string }) => (
    <p>
      Mesa {competitionId}/{gameId}/{token}
    </p>
  ),
}));

const render = () =>
  renderScreen(
    <Routes>
      <Route path="/mesa/:token" element={<MesaLinkScreen />} />
    </Routes>,
    '/mesa/abc123',
  );

describe('MesaLinkScreen', () => {
  it('opens the live sheet of the game in the link', () => {
    vi.mocked(useMesaByToken).mockReturnValue({
      jogo: { jogoId: 'j1', competicaoId: 'c1' },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useMesaByToken>);
    render();
    expect(useMesaByToken).toHaveBeenCalledWith('abc123');
    expect(screen.getByText('Mesa c1/j1/abc123')).toBeInTheDocument();
  });

  it('explains an expired or cancelled link', () => {
    vi.mocked(useMesaByToken).mockReturnValue({
      jogo: null,
      isLoading: false,
      error: { code: 'P0001', message: 'Este link de mesa expirou ou foi cancelado. Peça um novo ao coordenador.' },
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useMesaByToken>);
    render();
    expect(screen.getByText('Link de mesa indisponível')).toBeInTheDocument();
    expect(screen.getByText(/expirou ou foi cancelado/)).toBeInTheDocument();
  });
});
