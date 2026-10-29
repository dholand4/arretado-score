import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { AuthShellGlobal } from '..';

describe('AuthShellGlobal', () => {
  it('renders title, subtitle, content and footer', () => {
    renderWithRouter(
      <AuthShellGlobal title="Entrar" subtitle="Acesse o painel" footer={<span>rodapé</span>}>
        <form aria-label="login" />
      </AuthShellGlobal>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByText('Acesse o painel')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'login' })).toBeInTheDocument();
    expect(screen.getByText('rodapé')).toBeInTheDocument();
  });
});
