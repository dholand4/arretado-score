import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { CategoryFormModalGlobal } from '..';

describe('CategoryFormModalGlobal', () => {
  it('validates and submits uppercase sigla', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<CategoryFormModalGlobal open onSubmit={onSubmit} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Rebotes' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'reb' } });
    fireEvent.change(screen.getByLabelText('Título do ranking'), { target: { value: 'Reboteiro' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Rebotes', sigla: 'REB', titulo_ranking: 'Reboteiro', conta_cestas_de: null });
  });

  it('submits a category filled by the live score sheet', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<CategoryFormModalGlobal open onSubmit={onSubmit} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Cestas de 3' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: '3pt' } });
    fireEvent.change(screen.getByLabelText('Título do ranking'), { target: { value: 'Mão de seda' } });
    fireEvent.change(screen.getByLabelText('Preencher pela súmula ao vivo'), { target: { value: '3' } });
    expect(screen.getByText(/jogos já encerrados pela súmula ao vivo/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Cestas de 3', sigla: '3PT', titulo_ranking: 'Mão de seda', conta_cestas_de: 3 });
  });

  it('hides the live option for the score category', () => {
    renderWithTheme(
      <CategoryFormModalGlobal
        open
        isScoreCategory
        initialValues={{ nome: 'Pontos', sigla: 'PTS', titulo_ranking: 'Cestinha', conta_cestas_de: null }}
        onSubmit={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Preencher pela súmula ao vivo')).not.toBeInTheDocument();
  });
});
