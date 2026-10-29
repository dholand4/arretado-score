import { fireEvent, screen } from '@testing-library/react';
import type { IJogoResumo } from '@/@types/event';
import { renderWithTheme } from '@/utils/testUtils';
import { SwapGameModalGlobal } from '..';

const jogo = (id: string, casa: string, fora: string): IJogoResumo =>
  ({
    id,
    time_casa_id: casa,
    time_fora_id: fora,
    casa: { nome: `Time ${casa}`, sigla: null },
    fora: { nome: `Time ${fora}`, sigla: null },
    fase: { nome: 'Fase 1' },
    grupo: null,
    serie: null,
    rodada: 2,
    numero_na_serie: null,
  }) as IJogoResumo;

describe('SwapGameModalGlobal', () => {
  it('swaps a game for a candidate and flags repeated teams', () => {
    const onConfirm = vi.fn();
    renderWithTheme(
      <SwapGameModalGlobal
        open
        games={[jogo('j1', 'A', 'B'), jogo('j2', 'C', 'D')]}
        candidates={[jogo('j3', 'C', 'E'), jogo('j4', 'A', 'E')]}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('option', { name: /Time C x Time E .*\(time já joga neste dia\)/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Time A x Time E — Fase 1 · Rodada 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trocar' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Jogo que entra'), { target: { value: 'j4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    expect(onConfirm).toHaveBeenCalledWith('j1', 'j4');
  });

  it('explains when there are no candidates', () => {
    renderWithTheme(
      <SwapGameModalGlobal open games={[jogo('j1', 'A', 'B')]} candidates={[]} onConfirm={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText(/Não há outros jogos disponíveis/)).toBeInTheDocument();
  });
});
