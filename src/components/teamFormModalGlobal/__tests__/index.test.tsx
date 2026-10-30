import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { TeamFormModalGlobal } from '..';

const donos = [{ id: 'd1', nome: 'Davi' }];

describe('TeamFormModalGlobal', () => {
  it('creates a team linked to an existing equipe', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<TeamFormModalGlobal open donos={donos} onSubmit={onSubmit} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Nome do time'), { target: { value: 'Tubarões' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'tub' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Equipe já cadastrada' }));
    fireEvent.change(screen.getByLabelText('Equipe'), { target: { value: 'd1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit.mock.calls[0].slice(0, 2)).toEqual([{ nome: 'Tubarões', sigla: 'TUB', dono_id: 'd1' }, { kind: 'keep' }]);
  });

  it('creates the equipe login together with the team', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<TeamFormModalGlobal open donos={donos} onSubmit={onSubmit} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Nome do time'), { target: { value: 'Leões' } });
    fireEvent.change(screen.getByLabelText('Nome do responsável'), { target: { value: 'Léo' } });
    fireEvent.change(screen.getByLabelText('E-mail de acesso'), { target: { value: 'Leo@Gmail.com' } });
    fireEvent.change(screen.getByLabelText('Senha provisória'), { target: { value: 'senha12345' } });
    fireEvent.change(screen.getByLabelText('Telefone / WhatsApp'), { target: { value: '(88) 99999-1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit.mock.calls[0][2]).toEqual({
      nome: 'Léo',
      email: 'leo@gmail.com',
      senha: 'senha12345',
      telefone: '88999991234',
    });
  });

  it('changes the phone of the current equipe when editing', () => {
    const onSubmit = vi.fn();
    renderWithTheme(
      <TeamFormModalGlobal
        open
        initialValues={{ nome: 'Leões', sigla: 'LEO', dono_id: 'd1', logo_url: null }}
        donos={[{ id: 'd1', nome: 'Davi', telefone: '88999991234' }]}
        onSubmit={onSubmit}
        onClose={() => {}}
      />,
    );
    const telefone = screen.getByLabelText('Telefone / WhatsApp da equipe');
    expect(telefone).toHaveValue('(88) 99999-1234');
    fireEvent.change(telefone, { target: { value: '88 98888-0000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit.mock.calls[0][3]).toEqual({ id: 'd1', telefone: '88988880000' });
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
    expect(screen.queryByLabelText('Acesso da equipe')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nome do time'), { target: { value: 'Tubarões FC' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit.mock.calls[0][0].nome).toBe('Tubarões FC');
  });
});
