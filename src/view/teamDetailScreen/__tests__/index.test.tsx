import { fireEvent, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useDonos } from '@/hooks/useCompetitionAdmins';
import { useTeamRoster } from '@/hooks/useTeamRoster';
import { useTeam, useTeams } from '@/hooks/useTeams';
import { renderScreen } from '@/utils/testUtils';
import { TeamDetailScreen } from '..';

vi.mock('@/hooks/useTeams');
vi.mock('@/hooks/useTeamRoster');
vi.mock('@/hooks/useCompetitionAdmins');

const mutation = () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null });
const removeTeam = mutation();

beforeEach(() => {
  vi.mocked(useDonos).mockReturnValue({ donos: [], isLoading: false });
  vi.mocked(useTeam).mockReturnValue({
    team: { id: 't1', competicao_id: 'c1', nome: 'Tubarões', sigla: 'TUB', logo_url: null, dono_id: null, dono: null, competicao: { nome: 'Liga' } },
    isLoading: false,
    error: null,
    updateTeam: mutation(),
  } as unknown as ReturnType<typeof useTeam>);
  vi.mocked(useTeams).mockReturnValue({ removeTeam } as unknown as ReturnType<typeof useTeams>);
  vi.mocked(useTeamRoster).mockReturnValue({
    isLoading: false,
    error: null,
    actionError: null,
    rosterProps: {
      players: [{ id: 'j1', nome: 'Carlos', numero: 4, ativo: true, foto_url: null, apelido: null, posicao: null }],
      canDelete: true,
      onAdd: vi.fn(),
      onEdit: vi.fn(),
      onToggleActive: vi.fn(),
      onDelete: vi.fn(),
    },
    formProps: null,
    deleteProps: null,
    formKey: '',
  } as unknown as ReturnType<typeof useTeamRoster>);
});

describe('TeamDetailScreen', () => {
  it('shows the team, roster and admin actions', () => {
    renderScreen(
      <Routes>
        <Route path="/painel/competicoes/:competitionId/times/:teamId" element={<TeamDetailScreen />} />
      </Routes>,
      '/painel/competicoes/c1/times/t1',
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Tubarões' })).toBeInTheDocument();
    expect(screen.getByText('Sem acesso de equipe')).toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(useTeamRoster).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }), true);
    fireEvent.click(screen.getByRole('button', { name: 'Excluir time' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }));
    expect(removeTeam.mutate).toHaveBeenCalledWith('t1', expect.any(Object));
  });
});
