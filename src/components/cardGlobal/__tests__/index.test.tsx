import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { CardGlobal } from '..';

describe('CardGlobal', () => {
  it('renders title, actions and content', () => {
    renderWithTheme(
      <CardGlobal title="Resumo" actions={<button>Editar</button>}>
        <p>Conteúdo</p>
      </CardGlobal>,
    );
    expect(screen.getByRole('heading', { name: 'Resumo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });

  it('renders without header', () => {
    renderWithTheme(<CardGlobal>Só conteúdo</CardGlobal>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
