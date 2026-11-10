import type { IJogoLista } from '@/@types/game';
import type { IPublicPlayerGame } from '@/@types/public';
import { formatAverage, latestFirst, playerGameLine, sortPlayerGames } from '@/utils/publicView';

const jogo = (
  id: string,
  inicio: string | null,
  status = 'encerrado',
  created = '2026-10-01T00:00:00Z',
  numero: number | null = null,
) => ({ id, inicio_previsto: inicio, status, created_at: created, numero, numero_na_serie: null }) as IJogoLista;

describe('latestFirst', () => {
  it('lists the games from the last to the first, played or not', () => {
    const ordem = latestFirst([
      jogo('j1', '2026-11-01T22:00:00Z', 'encerrado', undefined, 1),
      jogo('j3', '2026-11-04T22:00:00Z', 'encerrado', undefined, 3),
      jogo('j6', '2026-11-08T23:00:00Z', 'agendado', undefined, 6),
      jogo('j2', '2026-11-01T23:00:00Z', 'encerrado', undefined, 2),
      jogo('j5', '2026-11-08T22:00:00Z', 'agendado', undefined, 5),
      jogo('j4', '2026-11-04T23:00:00Z', 'encerrado', undefined, 4),
    ]).map((j) => j.id);
    expect(ordem).toEqual(['j6', 'j5', 'j4', 'j3', 'j2', 'j1']);
  });

  it('puts games without a number after the numbered ones, undated last', () => {
    const ordem = latestFirst([
      jogo('sem-data', null, 'pendente', '2026-11-10T00:00:00Z'),
      jogo('j1', '2026-11-01T22:00:00Z', 'encerrado', undefined, 1),
      jogo('cancelado', '2026-11-03T22:00:00Z', 'cancelado'),
    ]).map((j) => j.id);
    expect(ordem).toEqual(['j1', 'cancelado', 'sem-data']);
  });
});

describe('formatAverage', () => {
  it('always shows one decimal, with a comma', () => {
    expect(formatAverage(12.5)).toBe('12,5');
    expect(formatAverage(8)).toBe('8,0');
    expect(formatAverage(7.26)).toBe('7,3');
  });
});

describe('playerGameLine', () => {
  const partida = (patch: Partial<IJogoLista>) =>
    ({
      id: 'j1',
      time_casa_id: 'a',
      time_fora_id: 'b',
      casa: { nome: 'Falcões', sigla: 'FAL' },
      fora: { nome: 'Trovão', sigla: 'TRO' },
      placar_casa: 80,
      placar_fora: 70,
      vencedor_id: 'a',
      inicio_previsto: '2026-11-07T22:00:00Z',
      ...patch,
    }) as IJogoLista;

  it('shows a home win from the player team point of view', () => {
    expect(playerGameLine(partida({}), 'a')).toEqual({ data: '07/11', adversario: 'Trovão', resultado: 'V', placar: '80 × 70' });
  });

  it('flips opponent and score for the away team, and marks the loss', () => {
    expect(playerGameLine(partida({}), 'b')).toEqual({ data: '07/11', adversario: 'Falcões', resultado: 'D', placar: '70 × 80' });
  });

  it('marks a draw when nobody won', () => {
    const linha = playerGameLine(partida({ placar_casa: 3, placar_fora: 3, vencedor_id: null }), 'a');
    expect(linha.resultado).toBe('E');
    expect(linha.placar).toBe('3 × 3');
  });

  it('uses the day in America/Fortaleza and a dash without a date', () => {
    // 01:30 UTC do dia 8 ainda é dia 7 em Fortaleza.
    expect(playerGameLine(partida({ inicio_previsto: '2026-11-08T01:30:00Z' }), 'a').data).toBe('07/11');
    expect(playerGameLine(partida({ inicio_previsto: null }), 'a').data).toBe('—');
  });
});

describe('sortPlayerGames', () => {
  it('lists the most recent game first, undated last', () => {
    const item = (id: string, inicio: string | null) => ({ jogo: jogo(id, inicio), time_id: 'a', valores: {} }) as IPublicPlayerGame;
    const ordem = sortPlayerGames([item('antigo', '2026-11-01T22:00:00Z'), item('sem-data', null), item('novo', '2026-11-08T22:00:00Z')]);
    expect(ordem.map((g) => g.jogo.id)).toEqual(['novo', 'antigo', 'sem-data']);
  });
});
