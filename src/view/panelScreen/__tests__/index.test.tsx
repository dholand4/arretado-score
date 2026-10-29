import { screen } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { renderScreen } from '@/utils/testUtils';
import { PanelScreen } from '..';

vi.mock('@/hooks/useAuth');

function mockPapel(papel: string) {
  vi.mocked(useAuth).mockReturnValue({
    profile: { nome: 'Ana Souza', papel },
  } as unknown as ReturnType<typeof useAuth>);
}

describe('PanelScreen', () => {
  it('shows the users shortcut to master', () => {
    mockPapel('master');
    renderScreen(<PanelScreen />);
    expect(screen.getByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Usuários/ })).toHaveAttribute('href', '/painel/usuarios');
  });

  it('hides the users shortcut from admin', () => {
    mockPapel('admin');
    renderScreen(<PanelScreen />);
    expect(screen.queryByRole('link', { name: /Usuários/ })).not.toBeInTheDocument();
    expect(screen.getByText('Competições')).toBeInTheDocument();
  });

  it('shows team shortcut to dono_time', () => {
    mockPapel('dono_time');
    renderScreen(<PanelScreen />);
    expect(screen.getByText('Meus times')).toBeInTheDocument();
  });
});
