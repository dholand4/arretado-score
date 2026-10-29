import { fireEvent, screen } from '@testing-library/react';
import type { IJogador } from '@/@types/competition';
import { renderWithTheme } from '@/utils/testUtils';
import { PlayerFormModalGlobal } from '..';

describe('PlayerFormModalGlobal', () => {
  it('requires a name and submits optional fields', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<PlayerFormModalGlobal open onSubmit={onSubmit} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByText('Informe o nome.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Carlos' } });
    fireEvent.change(screen.getByLabelText('Número'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledWith(
      { nome: 'Carlos', apelido: '', numero: 7, posicao: '', documento: '', ativo: true },
      { kind: 'keep' },
    );
  });

  it('edits an existing player, including active flag', () => {
    const onSubmit = vi.fn();
    const player = { id: 'j', nome: 'Ana', apelido: null, numero: null, posicao: 'Pivô', documento: null, ativo: true, foto_url: null } as IJogador;
    renderWithTheme(<PlayerFormModalGlobal open player={player} onSubmit={onSubmit} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Ativo/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ nome: 'Ana', numero: null, posicao: 'Pivô', ativo: false });
  });
});
