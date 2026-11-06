import { fireEvent, screen, within } from '@testing-library/react';
import type { ICategoria } from '@/@types/competition';
import { renderWithTheme } from '@/utils/testUtils';
import { CategoriesEditorGlobal } from '..';

const cat = (overrides: Partial<ICategoria>): ICategoria => ({
  id: 'x',
  competicao_id: 'c',
  nome: 'X',
  sigla: 'X',
  titulo_ranking: 'X',
  soma_no_placar: false,
  ordem: 1,
  ativa: true,
  created_at: '',
  conta_cestas_de: null,
  ...overrides,
});

const categories = [
  cat({ id: 'p', nome: 'Pontos', sigla: 'PTS', titulo_ranking: 'Cestinha', soma_no_placar: true, ordem: 1 }),
  cat({ id: 'r', nome: 'Rebotes', sigla: 'REB', titulo_ranking: 'Reboteiro', ordem: 2 }),
  cat({ id: 'a', nome: 'Assistências', sigla: 'AST', titulo_ranking: 'Garçom', ordem: 3 }),
];

const handlers = () => ({ onCreate: vi.fn(), onUpdate: vi.fn(), onRemove: vi.fn(), onMove: vi.fn() });

describe('CategoriesEditorGlobal', () => {
  it('protects the score category', () => {
    renderWithTheme(<CategoriesEditorGlobal categories={categories} {...handlers()} />);
    const row = screen.getByText(/Pontos \(PTS\)/).closest('li') as HTMLElement;
    expect(within(row).getByText('Placar')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Renomear' })).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });

  it('moves and toggles extra categories', () => {
    const h = handlers();
    renderWithTheme(<CategoriesEditorGlobal categories={categories} {...h} />);
    expect(screen.getByRole('button', { name: 'Subir Rebotes' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Descer Rebotes' }));
    expect(h.onMove).toHaveBeenCalledWith(categories[1], categories[2]);
    const row = screen.getByText(/Rebotes \(REB\)/).closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Desativar' }));
    expect(h.onUpdate).toHaveBeenCalledWith('r', { ativa: false });
  });

  it('creates a category through the modal', () => {
    const h = handlers();
    renderWithTheme(<CategoriesEditorGlobal categories={categories} {...h} />);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar estatística' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Nome'), { target: { value: 'Tocos' } });
    fireEvent.change(within(dialog).getByLabelText('Sigla'), { target: { value: 'TOC' } });
    fireEvent.change(within(dialog).getByLabelText('Título do ranking'), { target: { value: 'Paredão' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    expect(h.onCreate).toHaveBeenCalledWith({ nome: 'Tocos', sigla: 'TOC', titulo_ranking: 'Paredão', conta_cestas_de: null }, expect.any(Function));
  });

  it('shows when a category is filled by the live score sheet', () => {
    renderWithTheme(
      <CategoriesEditorGlobal
        categories={[...categories, cat({ id: 't', nome: 'Cestas de 3', sigla: '3PT', titulo_ranking: 'Mão de seda', conta_cestas_de: 3, ordem: 4 })]}
        {...handlers()}
      />,
    );
    expect(screen.getByText(/conta as cestas de 3 da súmula ao vivo/)).toBeInTheDocument();
  });
});
