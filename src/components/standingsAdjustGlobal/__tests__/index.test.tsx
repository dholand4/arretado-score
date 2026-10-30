import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/testUtils';
import { StandingsAdjustGlobal } from '..';

const tiedRows = [
  { time_id: 't1', nome: 'Falcões', posicao: 1 },
  { time_id: 't2', nome: 'Trovão', posicao: 2 },
];

describe('StandingsAdjustGlobal', () => {
  it('says when there is no technical tie', () => {
    renderWithTheme(<StandingsAdjustGlobal tiedRows={[]} onSave={() => {}} onRemove={() => {}} />);
    expect(screen.getByText(/Não há empate técnico/)).toBeInTheDocument();
  });

  it('saves a valid priority and removes an adjustment', () => {
    const onSave = vi.fn();
    const onRemove = vi.fn();
    renderWithTheme(<StandingsAdjustGlobal tiedRows={tiedRows} onSave={onSave} onRemove={onRemove} />);
    const [saveFirst] = screen.getAllByRole('button', { name: 'Salvar' });
    expect(saveFirst).toBeDisabled();
    fireEvent.change(screen.getByLabelText('2º Trovão — prioridade'), { target: { value: '1' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remover' })[0]);
    expect(onSave).toHaveBeenCalledWith('t2', 1);
    expect(onRemove).toHaveBeenCalledWith('t1');
  });
});
