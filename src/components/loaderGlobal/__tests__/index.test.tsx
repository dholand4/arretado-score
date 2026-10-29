import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { LoaderGlobal } from '..';

describe('LoaderGlobal', () => {
  it('has an accessible default label', () => {
    renderWithTheme(<LoaderGlobal />);
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
  });

  it('renders the visible label', () => {
    renderWithTheme(<LoaderGlobal label="Buscando usuários" />);
    expect(screen.getByText('Buscando usuários')).toBeInTheDocument();
  });
});
