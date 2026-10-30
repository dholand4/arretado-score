import { fireEvent, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useAdjustClassification, useClassification } from '@/hooks/useClassification';
import { useGames } from '@/hooks/useGames';
import { renderScreen } from '@/utils/testUtils';
import { GamesScreen } from '..';

vi.mock('@/hooks/useGames');
vi.mock('@/hooks/useClassification');

const jogo = (id: string, overrides = {}) => ({
  id,
  fase_id: 'f1',
  time_casa_id: 't1',
  time_fora_id: 't2',
  status: 'agendado',
  rodada: 1,
  numero_na_serie: null,
  inicio_previsto: null,
  placar_casa: null,
  placar_fora: null,
  casa: { nome: 'Falcões' },
  fora: { nome: 'Trovão' },
  fase: { nome: 'Fase 1' },
  grupo: null,
  serie: null,
  evento: null,
  ...overrides,
});

beforeEach(() => {
  vi.mocked(useGames).mockReturnValue({
    jogos: [jogo('g1'), jogo('g2', { status: 'encerrado', placar_casa: 80, placar_fora: 70, time_fora_id: 't3', fora: { nome: 'Leões' } })],
    fases: [{ id: 'f1', nome: 'Fase 1', tipo: 'todos_contra_todos', classificam: 4, melhores_extras: 0 }],
    times: [
      { id: 't1', nome: 'Falcões' },
      { id: 't3', nome: 'Leões' },
    ],
    grupos: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useGames>);
  vi.mocked(useClassification).mockReturnValue({
    linhas: [{ time_id: 't1', nome: 'Falcões', posicao: 1, j: 1, empate_tecnico: true }],
    extrasClassificados: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useClassification>);
  vi.mocked(useAdjustClassification).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  } as unknown as ReturnType<typeof useAdjustClassification>);
});

function renderAt() {
  return renderScreen(
    <Routes>
      <Route path="/painel/competicoes/:competitionId/jogos" element={<GamesScreen />} />
    </Routes>,
    '/painel/competicoes/c1/jogos',
  );
}

describe('GamesScreen', () => {
  it('lists games with status and the right action', () => {
    renderAt();
    const list = screen.getByRole('list', { name: 'Jogos' });
    expect(within(list).getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText('Lançar súmula ou W.O. →')).toBeInTheDocument();
    expect(screen.getByText('Editar resultado →')).toBeInTheDocument();
    expect(screen.getByText('80 × 70')).toBeInTheDocument();
  });

  it('filters by team and status', () => {
    renderAt();
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: 't3' } });
    expect(screen.getByText('1 jogo')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'pendente' } });
    expect(screen.getByText('Nenhum jogo com esses filtros')).toBeInTheDocument();
  });

  it('shows the tie adjustment when a phase is selected', () => {
    renderAt();
    fireEvent.change(screen.getByLabelText('Fase'), { target: { value: 'f1' } });
    expect(screen.getByRole('heading', { name: 'Empate técnico' })).toBeInTheDocument();
    expect(screen.getByLabelText('1º Falcões — prioridade')).toBeInTheDocument();
  });

  it('shows the empty state before the competition starts', () => {
    vi.mocked(useGames).mockReturnValue({
      jogos: [],
      fases: [],
      times: [],
      grupos: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGames>);
    renderAt();
    expect(screen.getByText('Nenhum jogo gerado')).toBeInTheDocument();
  });
});
