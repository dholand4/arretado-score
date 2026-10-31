import { fireEvent, screen } from '@testing-library/react';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { renderWithRouter } from '@/utils/testUtils';
import { PanelLayoutGlobal } from '..';

const props = {
  userName: 'Ana Souza',
  roleLabel: 'Admin',
  sections: [
    { key: 'geral', items: [{ to: '/painel/competicoes' as const, label: 'Competições' }] },
    {
      key: 'liga',
      title: 'Liga',
      items: [{ to: '/painel/competicoes/c1/times' as const, label: 'Times' }],
    },
  ],
};

function TeamPage() {
  useBackNavigation({ to: '/painel/competicoes/c1/times', label: 'Times' });
  return <p>Time</p>;
}

describe('PanelLayoutGlobal', () => {
  it('shows the back arrow only when the screen asks for it', () => {
    const { unmount } = renderWithRouter(
      <PanelLayoutGlobal {...props} onSignOut={() => {}}>
        <p>Lista</p>
      </PanelLayoutGlobal>,
    );
    expect(screen.queryByRole('link', { name: 'Voltar para Times' })).not.toBeInTheDocument();
    unmount();
    renderWithRouter(
      <PanelLayoutGlobal {...props} onSignOut={() => {}}>
        <TeamPage />
      </PanelLayoutGlobal>,
    );
    expect(screen.getByRole('link', { name: 'Voltar para Times' })).toHaveAttribute('href', '/painel/competicoes/c1/times');
  });

  it('welcomes the user and renders sections and content', () => {
    renderWithRouter(
      <PanelLayoutGlobal {...props} onSignOut={() => {}}>
        <p>Conteúdo</p>
      </PanelLayoutGlobal>,
    );
    expect(screen.getAllByText('Bem-vindo, Ana!').length).toBeGreaterThan(0);
    expect(screen.getByText('Liga')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });

  it('calls onSignOut', () => {
    const fn = vi.fn();
    renderWithRouter(<PanelLayoutGlobal {...props} onSignOut={fn}>x</PanelLayoutGlobal>);
    fireEvent.click(screen.getByRole('button', { name: 'Sair', hidden: true }));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('toggles the mobile menu', () => {
    renderWithRouter(<PanelLayoutGlobal {...props} onSignOut={() => {}}>x</PanelLayoutGlobal>);
    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
