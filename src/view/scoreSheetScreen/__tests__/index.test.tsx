import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { ISumula } from '@/@types/game';
import { useAuth } from '@/hooks/useAuth';
import { useScoreSheet } from '@/hooks/useScoreSheet';
import { renderScreen } from '@/utils/testUtils';
import { ScoreSheetScreen } from '..';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useScoreSheet');

const sumula = (overrides: Partial<ISumula> = {}): ISumula => ({
  jogo: {
    id: 'g1',
    time_casa_id: 'casa',
    time_fora_id: 'fora',
    status: 'agendado',
    so_placar: false,
    placar_casa: null,
    placar_fora: null,
    wo_ausente: null,
  } as ISumula['jogo'],
  casa: 'Falcões',
  fora: 'Trovão',
  competicao: { id: 'c1', permite_empate: false, wo_placar_vencedor: 20, wo_placar_perdedor: 0 },
  fase: { id: 'f1', nome: 'Fase 1', tipo: 'todos_contra_todos' },
  edicaoRestrita: false,
  jogadores: [
    { id: 'a1', time_id: 'casa', nome: 'Ana', apelido: null, numero: 4 },
    { id: 'b1', time_id: 'fora', nome: 'Bia', apelido: null, numero: 7 },
  ],
  categorias: [{ id: 'pts', nome: 'Pontos', sigla: 'PTS', soma_no_placar: true }],
  presentes: [],
  estatisticas: {},
  ...overrides,
});

const mutateAsync = vi.fn();

function mockSheet(value: ISumula, papel = 'admin') {
  vi.mocked(useAuth).mockReturnValue({ profile: { papel } } as unknown as ReturnType<typeof useAuth>);
  vi.mocked(useScoreSheet).mockReturnValue({
    sumula: value,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    saveResult: { mutateAsync, isPending: false, error: null },
  } as unknown as ReturnType<typeof useScoreSheet>);
}

function renderAt() {
  return renderScreen(
    <Routes>
      <Route path="/painel/competicoes/:competitionId/jogos/:gameId/sumula" element={<ScoreSheetScreen />} />
    </Routes>,
    '/painel/competicoes/c1/jogos/g1/sumula',
  );
}

beforeEach(() => mutateAsync.mockReset().mockResolvedValue(undefined));

describe('ScoreSheetScreen', () => {
  it('updates the live score and marks presence when a number is typed', () => {
    mockSheet(sumula());
    renderAt();
    fireEvent.change(screen.getByLabelText('PTS de Ana'), { target: { value: '12' } });
    expect(screen.getByRole('checkbox', { name: 'Ana jogou' })).toBeChecked();
    expect(screen.getByRole('status', { name: 'Placar: Falcões 12 x 0 Trovão' })).toBeInTheDocument();
  });

  it('saves the full sheet', async () => {
    mockSheet(sumula());
    renderAt();
    fireEvent.change(screen.getByLabelText('PTS de Ana'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('PTS de Bia'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ modo: 'completa', jogadores: expect.arrayContaining([{ jogador_id: 'a1', valores: { pts: 12 } }]) }),
      ),
    );
    expect(await screen.findByText(/Resultado salvo/)).toBeInTheDocument();
  });

  it('blocks a draw in basketball before calling the server', () => {
    mockSheet(sumula());
    renderAt();
    fireEvent.click(screen.getByRole('radio', { name: 'Só o placar' }));
    fireEvent.change(screen.getByLabelText('Falcões'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Trovão'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar resultado' }));
    expect(screen.getByRole('alert')).toHaveTextContent('não permite empate');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('shows the automatic W.O. score', () => {
    mockSheet(sumula());
    renderAt();
    fireEvent.click(screen.getByRole('radio', { name: 'W.O.' }));
    fireEvent.change(screen.getByLabelText('Quem faltou?'), { target: { value: 'fora' } });
    expect(screen.getByRole('status', { name: 'Placar: Falcões 20 x 0 Trovão' })).toBeInTheDocument();
  });

  it('locks editing for admins when the next phase already has results', () => {
    mockSheet(sumula({ edicaoRestrita: true }));
    renderAt();
    expect(screen.getByText(/só o admin master pode editar/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar resultado' })).toBeDisabled();
  });

  it('lets the master edit with a warning', () => {
    mockSheet(sumula({ edicaoRestrita: true }), 'master');
    renderAt();
    expect(screen.getByText(/confira séries e classificação/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar resultado' })).toBeEnabled();
  });
});
