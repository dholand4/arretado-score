import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useAdminUsers, useCompetitionAdmins } from '@/hooks/useCompetitionAdmins';
import { renderScreen } from '@/utils/testUtils';
import { CompetitionAdminsScreen } from '..';

vi.mock('@/hooks/useCompetitionAdmins');

const mutation = () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null });

describe('CompetitionAdminsScreen', () => {
  it('lists admins and adds an available one', () => {
    const addAdmin = mutation();
    const removeAdmin = mutation();
    vi.mocked(useCompetitionAdmins).mockReturnValue({
      admins: [{ user_id: 'a1', created_at: '', profile: { nome: 'Ana', ativo: true } }],
      isLoading: false,
      error: null,
      addAdmin,
      removeAdmin,
    } as unknown as ReturnType<typeof useCompetitionAdmins>);
    vi.mocked(useAdminUsers).mockReturnValue({
      adminUsers: [
        { id: 'a1', nome: 'Ana' },
        { id: 'a2', nome: 'Bruno' },
      ],
      isLoading: false,
    });

    renderScreen(
      <Routes>
        <Route path="/painel/competicoes/:competitionId/admins" element={<CompetitionAdminsScreen />} />
      </Routes>,
      '/painel/competicoes/c1/admins',
    );
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Ana' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Adicionar coordenador'), { target: { value: 'a2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(addAdmin.mutate).toHaveBeenCalledWith('a2', expect.any(Object));
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(removeAdmin.mutate).toHaveBeenCalledWith('a1');
  });
});
