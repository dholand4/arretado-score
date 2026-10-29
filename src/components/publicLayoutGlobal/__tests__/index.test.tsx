import { screen } from '@testing-library/react';
import { renderWithRouter } from '@/utils/testUtils';
import { PublicLayoutGlobal } from '..';

describe('PublicLayoutGlobal', () => {
  it('renders content and the account link', () => {
    renderWithRouter(
      <PublicLayoutGlobal accountLink={{ to: '/login', label: 'Entrar' }}>
        <p>Conteúdo público</p>
      </PublicLayoutGlobal>,
    );
    expect(screen.getByText('Conteúdo público')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
  });
});
