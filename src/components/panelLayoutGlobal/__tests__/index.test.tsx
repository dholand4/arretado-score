import { fireEvent, screen } from '@testing-library/react';
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

describe('PanelLayoutGlobal', () => {
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
