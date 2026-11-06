import type { IJogoLista } from '@/@types/game';
import { latestFirst } from '@/utils/publicView';

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
