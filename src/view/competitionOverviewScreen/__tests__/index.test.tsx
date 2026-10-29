import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { IFase } from '@/@types/phase';
import { useCategories } from '@/hooks/useCategories';
import { useCompetition } from '@/hooks/useCompetitions';
import { useGamesProgress, usePhases } from '@/hooks/usePhases';
import { useTeams } from '@/hooks/useTeams';
import { renderScreen } from '@/utils/testUtils';
import { CompetitionOverviewScreen } from '..';

vi.mock('@/hooks/useCompetitions');
vi.mock('@/hooks/useCategories');
vi.mock('@/hooks/useTeams');
vi.mock('@/hooks/usePhases');

const mutation = () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null });

const fase = (patch: Partial<IFase>): IFase =>
  ({
    id: 'f1',
    ordem: 1,
    nome: 'Fase 1',
    tipo: 'todos_contra_todos',
    turnos: 1,
    qtd_grupos: null,
    sorteio_grupos: 'aleatorio',
    classificam: null,
    melhores_extras: 0,
    melhor_de: 1,
    cruzamento: null,
    disputa_terceiro: false,
    status: 'aguardando',
    series: [],
    grupos: [],
    ...patch,
  }) as IFase;

function mockCompetition(status: string, teamsCount: number) {
  vi.mocked(useCompetition).mockReturnValue({
    competition: { id: 'c1', nome: 'Liga', modalidade: 'basquete', status, logo_url: null, estrutura_travada: false },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useCompetition>);
  vi.mocked(useCategories).mockReturnValue({
    categories: [{ id: 'p', ativa: true }],
  } as unknown as ReturnType<typeof useCategories>);
  vi.mocked(useTeams).mockReturnValue({
    teams: Array.from({ length: teamsCount }, (_, i) => ({ id: `t${i}`, nome: `Time ${i}`, jogadores: [{ count: 8 }] })),
    isLoading: false,
  } as unknown as ReturnType<typeof useTeams>);
}

function mockPhases(phases: IFase[], start = mutation(), redraw = mutation()) {
  vi.mocked(usePhases).mockReturnValue({
    phases,
    isLoading: false,
    startCompetition: start,
    redrawGroups: redraw,
  } as unknown as ReturnType<typeof usePhases>);
  return { start, redraw };
}

const renderOverview = () =>
  renderScreen(
    <Routes>
      <Route path="/painel/competicoes/:competitionId" element={<CompetitionOverviewScreen />} />
    </Routes>,
    '/painel/competicoes/c1',
  );

beforeEach(() => {
  vi.mocked(useGamesProgress).mockReturnValue({ games: [], isLoading: false, error: null });
});

describe('CompetitionOverviewScreen', () => {
  it('shows status, totals and next steps', () => {
    mockCompetition('rascunho', 1);
    mockPhases([]);
    renderOverview();
    expect(screen.getByRole('heading', { level: 1, name: 'Liga' })).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Cadastre ao menos 2 times (1 até agora)')).toBeInTheDocument();
    expect(screen.getByText('Configure as fases')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar competição' })).toBeDisabled();
  });

  it('starts the competition after confirmation', async () => {
    mockCompetition('rascunho', 5);
    const { start } = mockPhases([fase({})]);
    renderOverview();
    expect(screen.getByText('Fase 1: 5 times, todos contra todos, 10 jogos')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar competição' }));
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }));
    await waitFor(() => expect(start.mutate).toHaveBeenCalledWith(undefined, expect.any(Object)));
  });

  it('asks for the manual group distribution before starting', () => {
    mockCompetition('rascunho', 4);
    const { start } = mockPhases([fase({ tipo: 'grupos', qtd_grupos: 2, sorteio_grupos: 'manual' })]);
    renderOverview();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar competição' }));
    expect(screen.getByRole('dialog', { name: 'Distribuir times nos grupos' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar competição' }).at(-1) as HTMLElement);
    expect(start.mutate).toHaveBeenCalledWith({ A: ['t0', 't2'], B: ['t1', 't3'] }, expect.any(Object));
  });

  it('tracks the running phase and redraws groups', () => {
    mockCompetition('em_andamento', 4);
    const grupos = [
      { id: 'g1', nome: 'A', grupo_times: [{ time_id: 't0', time: { nome: 'Time 0' } }, { time_id: 't1', time: { nome: 'Time 1' } }] },
      { id: 'g2', nome: 'B', grupo_times: [{ time_id: 't2', time: { nome: 'Time 2' } }, { time_id: 't3', time: { nome: 'Time 3' } }] },
    ];
    const { redraw } = mockPhases([fase({ tipo: 'grupos', qtd_grupos: 2, status: 'em_andamento', grupos })]);
    vi.mocked(useGamesProgress).mockReturnValue({
      games: [
        { id: 'j1', fase_id: 'f1', status: 'pendente', evento_id: null },
        { id: 'j2', fase_id: 'f1', status: 'pendente', evento_id: null },
      ],
      isLoading: false,
      error: null,
    });
    renderOverview();
    expect(screen.getByText('2 jogos da Fase 1 sem dia definido')).toBeInTheDocument();
    expect(screen.getByText('Faltam 2 súmulas para fechar a Fase 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Montar dias' })).toHaveAttribute('href', '/painel/competicoes/c1/eventos');
    fireEvent.click(screen.getByRole('button', { name: 'Sortear de novo' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Sortear de novo' }).at(-1) as HTMLElement);
    expect(redraw.mutate).toHaveBeenCalledWith({ faseId: 'f1', distribuicao: undefined }, expect.any(Object));
  });
});
