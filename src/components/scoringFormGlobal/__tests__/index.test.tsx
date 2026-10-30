import { fireEvent, screen } from '@testing-library/react';
import type { ICompeticaoPontuacao } from '@/@types/competition';
import { renderWithTheme } from '@/utils/testUtils';
import { ScoringFormGlobal } from '..';

const padrao: ICompeticaoPontuacao = {
  pontos_vitoria: 1,
  pontos_derrota: 0,
  pontos_derrota_wo: 0,
  permite_empate: false,
  pontos_empate: 0,
  wo_placar_vencedor: 20,
  wo_placar_perdedor: 0,
  criterios_desempate: ['confronto_direto', 'saldo', 'pontos_pro'],
};

describe('ScoringFormGlobal', () => {
  it('saves W.O. as present x 0, W.O. loss as a loss and the fixed criteria', () => {
    const onSave = vi.fn();
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Vitória'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Derrota'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar e continuar' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        pontos_vitoria: 2,
        pontos_derrota: 1,
        pontos_derrota_wo: 1,
        wo_placar_vencedor: 20,
        wo_placar_perdedor: 0,
        criterios_desempate: ['saldo', 'confronto_direto'],
      }),
      true,
    );
  });

  it('shows the draw field only when draws are allowed', () => {
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} onSave={() => {}} />);
    expect(screen.queryByLabelText('Empate')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Permite empate/));
    expect(screen.getByLabelText('Empate')).toBeInTheDocument();
  });

  it('validates W.O. score', () => {
    const onSave = vi.fn();
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Placar do time presente'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/precisa ser maior/)).toBeInTheDocument();
  });

  it('avisa que a tabela será recalculada', () => {
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} warnRecalculation onSave={() => {}} />);
    expect(screen.getByText(/tabela será recalculada/)).toBeInTheDocument();
  });

  it('disables everything when locked', () => {
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} locked onSave={() => {}} />);
    expect(screen.getByLabelText('Vitória')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeDisabled();
  });
});
