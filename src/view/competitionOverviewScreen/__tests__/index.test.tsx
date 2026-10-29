import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { useCompetition } from '@/hooks/useCompetitions';
import { useTeams } from '@/hooks/useTeams';
import { renderScreen } from '@/utils/testUtils';
import { CompetitionOverviewScreen } from '..';

vi.mock('@/hooks/useCompetitions');
vi.mock('@/hooks/useCategories');
vi.mock('@/hooks/useTeams');

describe('CompetitionOverviewScreen', () => {
  it('shows status, totals and next steps', () => {
    vi.mocked(useCompetition).mockReturnValue({
      competition: { id: 'c1', nome: 'Liga', modalidade: 'basquete', status: 'rascunho', logo_url: null, estrutura_travada: false },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCompetition>);
    vi.mocked(useCategories).mockReturnValue({
      categories: [{ id: 'p', ativa: true }],
    } as unknown as ReturnType<typeof useCategories>);
    vi.mocked(useTeams).mockReturnValue({
      teams: [{ id: 't1', jogadores: [{ count: 8 }] }],
      isLoading: false,
    } as unknown as ReturnType<typeof useTeams>);

    renderScreen(
      <Routes>
        <Route path="/painel/competicoes/:competitionId" element={<CompetitionOverviewScreen />} />
      </Routes>,
      '/painel/competicoes/c1',
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Liga' })).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Cadastre ao menos 2 times (1 até agora)')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });
});
