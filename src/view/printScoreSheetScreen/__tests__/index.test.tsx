import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { usePrintableSheet } from '@/hooks/useScoreSheet';
import { renderScreen } from '@/utils/testUtils';
import { PrintScoreSheetScreen } from '..';

vi.mock('@/hooks/useScoreSheet');

const PATH = '/painel/competicoes/:competitionId/jogos/:gameId/sumula/imprimir';

function renderAt() {
  return renderScreen(
    <Routes>
      <Route path={PATH} element={<PrintScoreSheetScreen />} />
    </Routes>,
    '/painel/competicoes/c1/jogos/g1/sumula/imprimir',
  );
}

describe('PrintScoreSheetScreen', () => {
  it('renders the sheet and prints on demand', () => {
    vi.mocked(usePrintableSheet).mockReturnValue({
      sheet: {
        competicao: { nome: 'Liga', logo_url: null },
        casa: 'Falcões',
        fora: 'Trovão',
        fase: 'Fase 1',
        grupo: 'Grupo A',
        inicioPrevisto: null,
        evento: null,
        casaJogadores: [],
        foraJogadores: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePrintableSheet>);
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderAt();
    expect(screen.getByRole('article', { name: 'Súmula Falcões x Trovão' })).toBeInTheDocument();
    expect(screen.getByText('Fase 1 · Grupo A')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir ou salvar PDF' }));
    expect(print).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: '← Súmula' })).toHaveAttribute('href', '/painel/competicoes/c1/jogos/g1/sumula');
  });

  it('shows a loader while the sheet loads', () => {
    vi.mocked(usePrintableSheet).mockReturnValue({
      sheet: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePrintableSheet>);
    renderAt();
    expect(screen.getByRole('button', { name: 'Imprimir ou salvar PDF' })).toBeDisabled();
  });
});
