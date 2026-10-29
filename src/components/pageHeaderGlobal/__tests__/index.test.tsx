import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { PageHeaderGlobal } from '..';

describe('PageHeaderGlobal', () => {
  it('renders title as h1 with subtitle and actions', () => {
    renderWithTheme(<PageHeaderGlobal title="Usuários" subtitle="Gerencie" actions={<button>Novo</button>} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Usuários' })).toBeInTheDocument();
    expect(screen.getByText('Gerencie')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo' })).toBeInTheDocument();
  });
});
