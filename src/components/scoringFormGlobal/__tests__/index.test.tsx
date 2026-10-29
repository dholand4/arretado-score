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
  it('applies the FIBA preset and saves', () => {
    const onSave = vi.fn();
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} modalidade="basquete" onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Usar padrão FIBA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ pontos_vitoria: 2, pontos_derrota: 1, pontos_derrota_wo: 0, wo_placar_vencedor: 20 }),
      false,
    );
  });

  it('offers the futsal preset only for futsal and shows the draw field', () => {
    const { unmount } = renderWithTheme(<ScoringFormGlobal initialValues={padrao} modalidade="basquete" onSave={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Usar padrão futsal' })).not.toBeInTheDocument();
    unmount();
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} modalidade="futsal" onSave={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Usar padrão futsal' }));
    expect(screen.getByLabelText('Empate')).toHaveValue(1);
    expect(screen.getByLabelText('Vitória')).toHaveValue(3);
  });

  it('adds a criterion and keeps the order', () => {
    const onSave = vi.fn();
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} modalidade="basquete" onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Adicionar critério'), { target: { value: 'vitorias' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Subir Vitórias' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar e continuar' }));
    expect(onSave.mock.calls[0][0].criterios_desempate).toEqual(['confronto_direto', 'saldo', 'vitorias', 'pontos_pro']);
  });

  it('validates W.O. score', () => {
    const onSave = vi.fn();
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} modalidade="basquete" onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Placar do time presente'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/precisa ser maior/)).toBeInTheDocument();
  });

  it('disables everything when locked', () => {
    renderWithTheme(<ScoringFormGlobal initialValues={padrao} modalidade="basquete" locked onSave={() => {}} />);
    expect(screen.getByLabelText('Vitória')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeDisabled();
  });
});
