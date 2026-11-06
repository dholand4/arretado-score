import { fireEvent, screen } from '@testing-library/react';
import type { IRegrasPartida } from '@/@types/liveSheet';
import { renderWithTheme } from '@/utils/testUtils';
import { MatchRulesFormGlobal } from '..';

const regras: IRegrasPartida = {
  qtd_periodos: 2,
  duracao_periodo_min: 20,
  duracao_prorrogacao_min: 5,
  faltas_bonus_equipe: 7,
  faltas_exclusao_jogador: 5,
  tempos_primeira_metade: 2,
  tempos_segunda_metade: 3,
  tempos_prorrogacao: 1,
  relogio_posse: false,
  posse_segundos: 24,
  posse_reset_curto: 14,
  falta_para_relogio: false,
};

describe('MatchRulesFormGlobal', () => {
  it('saves the edited rules', () => {
    const onSave = vi.fn();
    renderWithTheme(<MatchRulesFormGlobal initialValues={regras} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Minutos por período'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));
    expect(onSave).toHaveBeenCalledWith({ ...regras, duracao_periodo_min: 15 });
  });

  it('fills the FIBA defaults and shows the shot clock fields', () => {
    const onSave = vi.fn();
    renderWithTheme(<MatchRulesFormGlobal initialValues={regras} onSave={onSave} />);
    expect(screen.queryByLabelText('Segundos de posse')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Usar padrão FIBA' }));
    expect(screen.getByLabelText('Segundos de posse')).toHaveValue(24);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ qtd_periodos: 4, duracao_periodo_min: 10, relogio_posse: true, falta_para_relogio: true }));
  });

  it('lets the league choose whether a foul stops the clock', () => {
    const onSave = vi.fn();
    renderWithTheme(<MatchRulesFormGlobal initialValues={regras} onSave={onSave} />);
    expect(screen.getByRole('checkbox', { name: /^Falta para o cronômetro/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: /^Falta para o cronômetro/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));
    expect(onSave).toHaveBeenCalledWith({ ...regras, falta_para_relogio: true });
  });

  it('rejects values out of range', () => {
    const onSave = vi.fn();
    renderWithTheme(<MatchRulesFormGlobal initialValues={regras} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Períodos'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));
    expect(screen.getByText('Use um número de 1 a 8.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
