import { screen } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useCompetitions } from '@/hooks/useCompetitions';
import { renderScreen } from '@/utils/testUtils';
import { CompetitionsScreen } from '..';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useCompetitions');

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ profile: { papel: 'admin' } } as unknown as ReturnType<typeof useAuth>);
});

const mockList = (value: Partial<ReturnType<typeof useCompetitions>>) =>
  vi.mocked(useCompetitions).mockReturnValue({
    competitions: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...value,
  } as unknown as ReturnType<typeof useCompetitions>);

describe('CompetitionsScreen', () => {
  it('shows the empty state with a create link for the master', () => {
    vi.mocked(useAuth).mockReturnValue({ profile: { papel: 'master' } } as unknown as ReturnType<typeof useAuth>);
    mockList({});
    renderScreen(<CompetitionsScreen />);
    expect(screen.getByText('Nenhuma competição ainda')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Nova competição' })[0]).toHaveAttribute('href', '/painel/competicoes/nova');
  });

  it('hides the create link from admins', () => {
    mockList({});
    renderScreen(<CompetitionsScreen />);
    expect(screen.getByText('Nenhuma competição ainda')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Nova competição' })).not.toBeInTheDocument();
  });

  it('lists competitions with team counts', () => {
    mockList({
      competitions: [
        { id: 'c1', nome: 'Liga', modalidade: 'basquete', status: 'rascunho', logo_url: null, times: [{ count: 5 }] },
      ] as unknown as ReturnType<typeof useCompetitions>['competitions'],
    });
    renderScreen(<CompetitionsScreen />);
    expect(screen.getByRole('link', { name: /Liga/ })).toHaveAttribute('href', '/painel/competicoes/c1');
    expect(screen.getByText('5 times')).toBeInTheDocument();
  });
});
