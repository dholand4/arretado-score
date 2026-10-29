import { fireEvent, screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { PanelLayoutGlobal } from '..';

const props = {
  userName: 'Ana',
  roleLabel: 'Admin master',
  navItems: [
    { to: '/painel' as const, label: 'Início', end: true },
    { to: '/painel/usuarios' as const, label: 'Usuários' },
  ],
};

describe('PanelLayoutGlobal', () => {
  it('renders user info, nav items and content', () => {
    renderWithRouter(
      <PanelLayoutGlobal {...props} onSignOut={() => {}}>
        <p>Conteúdo</p>
      </PanelLayoutGlobal>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Admin master')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('href', '/painel/usuarios');
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });

  it('calls onSignOut', () => {
    const fn = vi.fn();
    renderWithRouter(<PanelLayoutGlobal {...props} onSignOut={fn}>x</PanelLayoutGlobal>);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('toggles the mobile menu', () => {
    renderWithRouter(<PanelLayoutGlobal {...props} onSignOut={() => {}}>x</PanelLayoutGlobal>);
    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
