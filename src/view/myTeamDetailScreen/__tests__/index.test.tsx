import { fireEvent, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useTeamRoster } from '@/hooks/useTeamRoster';
import { useTeam } from '@/hooks/useTeams';
import { renderScreen } from '@/utils/testUtils';
import { MyTeamDetailScreen } from '..';

vi.mock('@/hooks/useTeams');
vi.mock('@/hooks/useTeamRoster');

const updateTeam = { mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null };

beforeEach(() => {
  vi.mocked(useTeam).mockReturnValue({
    team: { id: 't1', competicao_id: 'c1', nome: 'Tubarões', sigla: 'TUB', logo_url: null, dono_id: 'd1', competicao: { nome: 'Liga' } },
    isLoading: false,
    error: null,
    updateTeam,
  } as unknown as ReturnType<typeof useTeam>);
  vi.mocked(useTeamRoster).mockReturnValue({
    isLoading: false,
    error: null,
    actionError: null,
    rosterProps: { players: [], canDelete: false, onAdd: vi.fn(), onEdit: vi.fn(), onToggleActive: vi.fn() },
    formProps: null,
    deleteProps: null,
    formKey: '',
  } as unknown as ReturnType<typeof useTeamRoster>);
});

describe('MyTeamDetailScreen', () => {
  it('uses the owner roster (no delete) and edits only the name', () => {
    renderScreen(
      <Routes>
        <Route path="/painel/meus-times/:teamId" element={<MyTeamDetailScreen />} />
      </Routes>,
      '/painel/meus-times/t1',
    );
    expect(useTeamRoster).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }), false);
    fireEvent.click(screen.getByRole('button', { name: 'Editar nome e logo' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByLabelText('Sigla')).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Nome do time'), { target: { value: 'Tubarões FC' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(updateTeam.mutate).toHaveBeenCalledWith(
      { patch: { nome: 'Tubarões FC' }, logo: { kind: 'keep' } },
      expect.any(Object),
    );
  });
});
