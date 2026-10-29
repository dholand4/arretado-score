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
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Rebotes', sigla: 'REB', titulo_ranking: 'Reboteiro' });
  });
});
