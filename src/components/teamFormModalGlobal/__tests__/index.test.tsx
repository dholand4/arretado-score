import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { TeamFormModalGlobal } from '..';

const donos = [{ id: 'd1', nome: 'Davi' }];

describe('TeamFormModalGlobal', () => {
  it('creates a team with sigla and dono', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<TeamFormModalGlobal open donos={donos} onSubmit={onSubmit} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Nome do time'), { target: { value: 'Tubarões' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'tub' } });
    fireEvent.change(screen.getByLabelText('Dono do time'), { target: { value: 'd1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Tubarões', sigla: 'TUB', dono_id: 'd1' }, { kind: 'keep' });
  });

  it('owner mode only edits the name', () => {
    const onSubmit = vi.fn();
    renderWithTheme(
      <TeamFormModalGlobal
        open
        ownerMode
        initialValues={{ nome: 'Tubarões', sigla: 'TUB', dono_id: 'd1', logo_url: null }}
        onSubmit={onSubmit}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Sigla')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Dono do time')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nome do time'), { target: { value: 'Tubarões FC' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit.mock.calls[0][0].nome).toBe('Tubarões FC');
  });
});
