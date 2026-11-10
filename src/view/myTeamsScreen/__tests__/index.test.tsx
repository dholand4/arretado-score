import { screen } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useMyTeams } from '@/hooks/useTeams';
import { renderScreen } from '@/utils/testUtils';
import { MyTeamsScreen } from '..';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useTeams');

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'd1' } } as unknown as ReturnType<typeof useAuth>);
});

describe('MyTeamsScreen', () => {
  it('lists the owner teams with competition name', () => {
    vi.mocked(useMyTeams).mockReturnValue({
      teams: [{ id: 't1', nome: 'Tubarões', logo_url: null, competicao: { nome: 'Liga', status: 'rascunho' } }],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useMyTeams>);
    renderScreen(<MyTeamsScreen />);
    expect(useMyTeams).toHaveBeenCalledWith('d1');
    expect(screen.getByRole('link', { name: /Tubarões/ })).toHaveAttribute('href', '/painel/meus-times/t1/inicio');
    expect(screen.getByText('Liga')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    vi.mocked(useMyTeams).mockReturnValue({ teams: [], isLoading: false, error: null } as unknown as ReturnType<typeof useMyTeams>);
    renderScreen(<MyTeamsScreen />);
    expect(screen.getByText('Nenhum time vinculado')).toBeInTheDocument();
  });
});
