import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { ICompeticao } from '@/@types/competition';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useCompetition, useCreateCompetition } from '@/hooks/useCompetitions';
import { useTeams } from '@/hooks/useTeams';
import { renderScreen } from '@/utils/testUtils';
import { CompetitionWizardScreen } from '..';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useCompetitions');
vi.mock('@/hooks/useCategories');
vi.mock('@/hooks/useTeams');

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
    expect(screen.getByRole('button', { name: /Pontuação e W.O./ })).toBeDisabled();
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
    } as unknown as ReturnType<typeof useCompetition>);
    renderAt('/painel/competicoes/c1/configuracao?etapa=pontuacao');
    expect(screen.getByRole('button', { name: /Pontuação e W.O./ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText(/estrutura está travada/)).toBeInTheDocument();
    expect(screen.getByLabelText('Vitória')).toBeDisabled();
  });

  it('switches steps through the stepper', () => {
    vi.mocked(useCompetition).mockReturnValue({
      competition,
      isLoading: false,
      error: null,
      saveBasics: mutation(),
      saveScoring: mutation(),
    } as unknown as ReturnType<typeof useCompetition>);
    renderAt('/painel/competicoes/c1/configuracao');
    fireEvent.click(screen.getByRole('button', { name: /Revisão/ }));
    expect(screen.getByText('/c/liga')).toBeInTheDocument();
  });
});
