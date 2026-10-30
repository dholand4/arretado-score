import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useClassification, usePublicStandings } from '@/hooks/useClassification';
import { renderScreen } from '@/utils/testUtils';
import { PublicStandingsScreen } from '..';

vi.mock('@/hooks/useClassification');

const linha = { posicao: 1, time_id: 't1', nome: 'Falcões', j: 1, v: 1, e: 0, d: 0, wo: 0, pts: 2, pf: 80, pc: 70, saldo: 10, aproveitamento: 1, empate_tecnico: false };

beforeEach(() => {
  vi.mocked(usePublicStandings).mockReturnValue({
    tabela: {
      competicao: { id: 'c', nome: 'Liga', slug: 'liga', permite_empate: false },
      fases: [
        { id: 'f1', nome: 'Classificação', ordem: 1, tipo: 'todos_contra_todos', classificam: 4, melhores_extras: 0 },
        { id: 'f2', nome: 'Grupos', ordem: 2, tipo: 'grupos', classificam: 1, melhores_extras: 0 },
      ],
      grupos: [
        { id: 'ga', fase_id: 'f2', nome: 'A' },
        { id: 'gb', fase_id: 'f2', nome: 'B' },
      ],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof usePublicStandings>);
  vi.mocked(useClassification).mockReturnValue({
    linhas: [linha],
    extrasClassificados: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useClassification>);
});

describe('PublicStandingsScreen', () => {
  it('shows the first phase and switches to groups', () => {
    renderScreen(
      <Routes>
        <Route path="/c/:slug/tabela" element={<PublicStandingsScreen />} />
      </Routes>,
      '/c/liga/tabela',
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Tabela' })).toBeInTheDocument();
    expect(screen.getByText('Falcões')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Grupos' }));
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
    expect(screen.getByText('Grupo B')).toBeInTheDocument();
  });
});
