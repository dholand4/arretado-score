import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { EmptyStateGlobal } from '..';

describe('EmptyStateGlobal', () => {
  it('renders title, description and action', () => {
    renderWithTheme(
      <EmptyStateGlobal title="Nada aqui" description="Ainda vazio" action={<button>Criar</button>} />,
    );
    expect(screen.getByRole('heading', { name: 'Nada aqui' })).toBeInTheDocument();
    expect(screen.getByText('Ainda vazio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument();
  });
});
