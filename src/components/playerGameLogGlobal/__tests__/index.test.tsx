import { screen, within } from '@testing-library/react';
import type { IPublicCategory, IPublicPlayerGame } from '@/@types/public';
import { renderWithRouter } from '@/utils/testUtils';
import { PlayerGameLogGlobal } from '..';

const categorias = [
  { id: 'pts', nome: 'Pontos', sigla: 'PTS', titulo_ranking: 'Cestinha', soma_no_placar: true },
  { id: 'reb', nome: 'Rebotes', sigla: 'REB', titulo_ranking: 'Reboteiro', soma_no_placar: false },
] as IPublicCategory[];

const jogos = [
  {
    time_id: 'a',
    valores: { pts: 22 },
    jogo: {
      id: 'j1',
      time_casa_id: 'a',
      time_fora_id: 'b',
      casa: { nome: 'Falcões', sigla: 'FAL' },
      fora: { nome: 'Trovão', sigla: 'TRO' },
      placar_casa: 80,
      placar_fora: 70,
      vencedor_id: 'a',
      inicio_previsto: '2026-11-07T22:00:00Z',
    },
  },
  {
    time_id: 'a',
    valores: { pts: 9, reb: 4 },
    jogo: {
      id: 'j2',
      time_casa_id: 'c',
      time_fora_id: 'a',
      casa: { nome: 'Tubarões', sigla: 'TUB' },
      fora: { nome: 'Falcões', sigla: 'FAL' },
      placar_casa: 66,
      placar_fora: 60,
      vencedor_id: 'c',
      inicio_previsto: '2026-11-01T22:00:00Z',
    },
  },
] as unknown as IPublicPlayerGame[];

describe('PlayerGameLogGlobal', () => {
  it('lists each game with opponent, result and the player numbers', () => {
    renderWithRouter(<PlayerGameLogGlobal games={jogos} categories={categorias} gameHref={(id) => `/c/liga/jogos/${id}`} />);
    expect(screen.getByRole('columnheader', { name: 'PTS' })).toHaveAttribute('title', 'Pontos');

    const [, vitoria, derrota] = screen.getAllByRole('row');
    expect(within(vitoria).getByRole('link', { name: 'x Trovão' })).toHaveAttribute('href', '/c/liga/jogos/j1');
    expect(within(vitoria).getByText('Vitória')).toBeInTheDocument();
    expect(within(vitoria).getByText('80 × 70')).toBeInTheDocument();
    expect(within(vitoria).getByText('07/11')).toBeInTheDocument();
    // Categoria sem valor lançado no jogo aparece como 0.
    expect(within(vitoria).getAllByRole('cell').map((c) => c.textContent).slice(-2)).toEqual(['22', '0']);

    expect(within(derrota).getByRole('link', { name: 'x Tubarões' })).toHaveAttribute('href', '/c/liga/jogos/j2');
    expect(within(derrota).getByText('Derrota')).toBeInTheDocument();
    expect(within(derrota).getByText('60 × 66')).toBeInTheDocument();
    expect(within(derrota).getAllByRole('cell').map((c) => c.textContent).slice(-2)).toEqual(['9', '4']);
  });
});
