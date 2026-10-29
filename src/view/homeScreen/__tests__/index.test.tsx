import { screen } from '@testing-library/react';
import { usePublicCompetitions } from '@/hooks/useCompetitions';
import { renderScreen } from '@/utils/testUtils';
import { HomeScreen } from '..';

vi.mock('@/hooks/useCompetitions');

const mock = (competitions: unknown[]) =>
  vi.mocked(usePublicCompetitions).mockReturnValue({
    competitions,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof usePublicCompetitions>);

describe('HomeScreen', () => {
  it('renders the empty competitions state', () => {
    mock([]);
    renderScreen(<HomeScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'Campeonatos' })).toBeInTheDocument();
    expect(screen.getByText('Nenhuma competição publicada ainda')).toBeInTheDocument();
  });

  it('lists public competitions', () => {
    mock([{ id: 'c', nome: 'Copa', modalidade: 'futsal', status: 'em_andamento', logo_url: null }]);
    renderScreen(<HomeScreen />);
    expect(screen.getByText('Copa')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
  });
});
