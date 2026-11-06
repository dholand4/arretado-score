import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { ICompeticao } from '@/@types/competition';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useCompetition, useCreateCompetition } from '@/hooks/useCompetitions';
import { usePhases } from '@/hooks/usePhases';
import { useTeams } from '@/hooks/useTeams';
import { renderScreen } from '@/utils/testUtils';
import { CompetitionWizardScreen } from '..';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useCompetitions');
vi.mock('@/hooks/useCategories');
vi.mock('@/hooks/useTeams');
vi.mock('@/hooks/usePhases');

const mutation = () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null });

const competition = {
  id: 'c1',
  nome: 'Liga',
  slug: 'liga',
  modalidade: 'basquete',
  descricao: null,
  local_padrao: 'Ginásio',
  intervalo_jogos_min: 90,
  logo_url: null,
  status: 'rascunho',
  estrutura_travada: false,
  pontos_vitoria: 1,
  pontos_derrota: 0,
  pontos_derrota_wo: 0,
  permite_empate: false,
  pontos_empate: 0,
  wo_placar_vencedor: 20,
  wo_placar_perdedor: 0,
  criterios_desempate: ['confronto_direto', 'saldo', 'pontos_pro'],
} as unknown as ICompeticao;

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ profile: { papel: 'admin' } } as unknown as ReturnType<typeof useAuth>);
  vi.mocked(useCategories).mockReturnValue({
    categories: [],
    isLoading: false,
    createCategory: mutation(),
    updateCategory: mutation(),
    removeCategory: mutation(),
    moveCategory: mutation(),
  } as unknown as ReturnType<typeof useCategories>);
  vi.mocked(useTeams).mockReturnValue({ teams: [] } as unknown as ReturnType<typeof useTeams>);
  vi.mocked(usePhases).mockReturnValue({
    phases: [],
    isLoading: false,
    error: null,
    savePhases: mutation(),
  } as unknown as ReturnType<typeof usePhases>);
});

function renderAt(path: string) {
  return renderScreen(
    <Routes>
      <Route path="/painel/competicoes/nova" element={<CompetitionWizardScreen />} />
      <Route path="/painel/competicoes/:competitionId/configuracao" element={<CompetitionWizardScreen />} />
    </Routes>,
    path,
  );
}

describe('CompetitionWizardScreen', () => {
  it('creates a competition from the basics step', async () => {
    const create = mutation();
    vi.mocked(useCreateCompetition).mockReturnValue(create as unknown as ReturnType<typeof useCreateCompetition>);
    renderAt('/painel/competicoes/nova');
    expect(screen.getByRole('button', { name: /Pontuação/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Nome da competição'), { target: { value: 'Copa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar e continuar' }));
    await waitFor(() =>
      expect(create.mutate).toHaveBeenCalledWith(
        { input: expect.objectContaining({ nome: 'Copa', slug: 'copa' }), logo: { kind: 'keep' } },
        expect.any(Object),
      ),
    );
  });

  it('opens the step from the query string and locks scoring when the structure is locked', () => {
    vi.mocked(useCompetition).mockReturnValue({
      competition: { ...competition, estrutura_travada: true },
      isLoading: false,
      error: null,
      saveBasics: mutation(),
      saveScoring: mutation(),
      saveMatchRules: mutation(),
      saveBilling: mutation(),
      setActive: mutation(),
    } as unknown as ReturnType<typeof useCompetition>);
    renderAt('/painel/competicoes/c1/configuracao?etapa=pontuacao');
    expect(screen.getByRole('button', { name: /Pontuação/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText(/estrutura está travada/)).toBeInTheDocument();
    expect(screen.getByLabelText('Vitória')).toBeDisabled();
  });

  it('shows the match rules in their own step, right after the basics', () => {
    const saveMatchRules = mutation();
    vi.mocked(useCompetition).mockReturnValue({
      competition: { ...competition, falta_para_relogio: false },
      isLoading: false,
      error: null,
      saveBasics: mutation(),
      saveScoring: mutation(),
      saveMatchRules,
      saveBilling: mutation(),
      setActive: mutation(),
    } as unknown as ReturnType<typeof useCompetition>);
    renderAt('/painel/competicoes/c1/configuracao?etapa=regras');
    const etapas = screen.getAllByRole('button', { name: /Dados básicos|Regras|Pontuação|Estatísticas|Fases|Cobrança|Times|Revisão/ });
    expect(etapas.map((b) => b.textContent?.replace(/^\d+/, ''))).toEqual([
      'Dados básicos',
      'Regras',
      'Pontuação',
      'Estatísticas',
      'Fases',
      'Cobrança',
      'Times',
      'Revisão',
    ]);
    expect(screen.getByRole('button', { name: /Regras/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('checkbox', { name: /^Falta para o cronômetro/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Vitória')).not.toBeInTheDocument();
  });

  it('switches steps through the stepper', () => {
    vi.mocked(useCompetition).mockReturnValue({
      competition,
      isLoading: false,
      error: null,
      saveBasics: mutation(),
      saveScoring: mutation(),
      saveMatchRules: mutation(),
      saveBilling: mutation(),
      setActive: mutation(),
    } as unknown as ReturnType<typeof useCompetition>);
    renderAt('/painel/competicoes/c1/configuracao');
    fireEvent.click(screen.getByRole('button', { name: /Revisão/ }));
    expect(screen.getByText('/c/liga')).toBeInTheDocument();
  });

  it('edits the phases step and saves the series configuration', async () => {
    vi.mocked(useCompetition).mockReturnValue({
      competition,
      isLoading: false,
      error: null,
      saveBasics: mutation(),
      saveScoring: mutation(),
      saveMatchRules: mutation(),
      saveBilling: mutation(),
      setActive: mutation(),
    } as unknown as ReturnType<typeof useCompetition>);
    vi.mocked(useTeams).mockReturnValue({
      teams: [1, 2, 3, 4, 5].map((n) => ({ id: `t${n}` })),
    } as unknown as ReturnType<typeof useTeams>);
    const savePhases = mutation();
    vi.mocked(usePhases).mockReturnValue({
      phases: [],
      isLoading: false,
      error: null,
      savePhases,
    } as unknown as ReturnType<typeof usePhases>);
    renderAt('/painel/competicoes/c1/configuracao?etapa=fases');
    expect(screen.getByRole('button', { name: /Fases/ })).toHaveAttribute('aria-current', 'step');
    fireEvent.change(screen.getByLabelText('Nome da fase'), { target: { value: 'Fase 1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar fase' }));
    fireEvent.change(screen.getByLabelText('Quantos avançam'), { target: { value: '4' } });
    expect(screen.getByRole('list', { name: /Resumo do formato/ })).toHaveAccessibleName(
      'Resumo do formato: Fase 1: 5 times, todos contra todos, 10 jogos → 4 avançam → Fase 2 jogo único: 1º x 4º, 2º x 3º',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    await waitFor(() =>
      expect(savePhases.mutate).toHaveBeenCalledWith(
        [
          expect.objectContaining({ nome: 'Fase 1', classificam: 4 }),
          expect.objectContaining({ tipo: 'mata_mata', cruzamento: 'por_campanha' }),
        ],
        expect.any(Object),
      ),
    );
  });

  it('warns that the phases are locked for admins', () => {
    vi.mocked(useCompetition).mockReturnValue({
      competition: { ...competition, estrutura_travada: true, status: 'em_andamento' },
      isLoading: false,
      error: null,
      saveBasics: mutation(),
      saveScoring: mutation(),
      saveMatchRules: mutation(),
      saveBilling: mutation(),
      setActive: mutation(),
    } as unknown as ReturnType<typeof useCompetition>);
    renderAt('/painel/competicoes/c1/configuracao?etapa=fases');
    expect(screen.getByText(/Só o admin master pode alterar as fases/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeDisabled();
  });
});
