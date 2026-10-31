import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { EventFormModalGlobal } from '..';

const initial = {
  data: '2026-11-07',
  local: 'Ginásio Municipal',
  hora_inicio: '19:00',
  qtd_jogos: 2,
  intervalo_min: 90,
  observacoes: '',
  times: null,
};

describe('EventFormModalGlobal', () => {
  it('comes prefilled and submits the values', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<EventFormModalGlobal open initialValues={initial} onSubmit={onSubmit} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Local')).toHaveValue('Ginásio Municipal');
    expect(screen.getByLabelText('Intervalo (min)')).toHaveValue(90);
    fireEvent.change(screen.getByLabelText('Quantidade de jogos'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Montar dia' }));
    expect(onSubmit).toHaveBeenCalledWith({ ...initial, qtd_jogos: 3 });
  });

  it('edits only date, time, place, interval and notes of a day', () => {
    const onSubmit = vi.fn();
    renderWithTheme(
      <EventFormModalGlobal
        open
        mode="edit"
        initialValues={initial}
        teams={[{ id: 't1', nome: 'Falcões' }]}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Editar dia de jogos' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Quantidade de jogos')).not.toBeInTheDocument();
    expect(screen.queryByText('Times que vão jogar no dia')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-11-14' } });
    fireEvent.change(screen.getByLabelText('Hora de início'), { target: { value: '18:30' } });
    fireEvent.change(screen.getByLabelText('Local'), { target: { value: ' Ginásio B ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledWith({ ...initial, data: '2026-11-14', hora_inicio: '18:30', local: 'Ginásio B' });
  });

  it('validates required fields', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<EventFormModalGlobal open initialValues={initial} onSubmit={onSubmit} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Local'), { target: { value: ' ' } });
    fireEvent.change(screen.getByLabelText('Quantidade de jogos'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Montar dia' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Informe o local.')).toBeInTheDocument();
    expect(screen.getByText('Informe ao menos 1 jogo.')).toBeInTheDocument();
  });
});
