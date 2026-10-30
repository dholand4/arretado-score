import { fireEvent, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { useDonos } from '@/hooks/useCompetitionAdmins';
import { useTeams } from '@/hooks/useTeams';
import { renderScreen } from '@/utils/testUtils';
import { TeamsScreen } from '..';

vi.mock('@/hooks/useTeams');
vi.mock('@/hooks/useCompetitionAdmins');

const createTeam = { mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null };

beforeEach(() => {
  vi.mocked(useDonos).mockReturnValue({ donos: [{ id: 'd1', nome: 'Davi' }], isLoading: false });
  vi.mocked(useTeams).mockReturnValue({
    teams: [
      {
        id: 't1',
        nome: 'Tubarões',
        sigla: 'TUB',
        logo_url: null,
        dono: { nome: 'Davi', telefone: '88999991234' },
        jogadores: [{ count: 8 }],
      },
      { id: 't2', nome: 'Falcões', sigla: null, logo_url: null, dono: null, jogadores: [{ count: 0 }] },
    ],
    isLoading: false,
    error: null,
    createTeam,
  } as unknown as ReturnType<typeof useTeams>);
});

function renderScreenAt() {
  return renderScreen(
    <Routes>
      <Route path="/painel/competicoes/:competitionId/times" element={<TeamsScreen />} />
    </Routes>,
    '/painel/competicoes/c1/times',
  );
}

describe('TeamsScreen', () => {
  it('lists teams with dono and player count', () => {
    renderScreenAt();
    expect(screen.getByRole('link', { name: /Tubarões/ })).toHaveAttribute('href', '/painel/competicoes/c1/times/t1');
    expect(screen.getByText('8 jogadores · Equipe: Davi')).toBeInTheDocument();
    expect(screen.getByText('0 jogadores · Sem acesso de equipe')).toBeInTheDocument();
  });

  it('keeps the phone out of the card and explains a match by phone', () => {
    renderScreenAt();
    expect(screen.queryByText(/99999/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: '99999-12' } });
    expect(screen.getByRole('link', { name: /Tubarões/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Falcões/ })).not.toBeInTheDocument();
    expect(screen.getByText('Encontrado pelo telefone da equipe')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'Tub' } });
    expect(screen.queryByText('Encontrado pelo telefone da equipe')).not.toBeInTheDocument();
  });

  it('creates a team linked to an existing equipe', () => {
    renderScreenAt();
    fireEvent.click(screen.getByRole('button', { name: 'Novo time' }));
    const dialog = screen.getByRole('dialog', { name: 'Novo time' });
    fireEvent.change(within(dialog).getByLabelText('Nome do time'), { target: { value: 'Leões' } });
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Equipe já cadastrada' }));
    fireEvent.change(within(dialog).getByLabelText('Equipe'), { target: { value: 'd1' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(createTeam.mutate).toHaveBeenCalledWith(
      { input: { nome: 'Leões', sigla: '', dono_id: 'd1' }, logo: { kind: 'keep' }, novoDono: undefined },
      expect.any(Object),
    );
  });
});
