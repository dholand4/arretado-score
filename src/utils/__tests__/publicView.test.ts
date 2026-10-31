import type { IJogoLista } from '@/@types/game';
import { latestFirst } from '@/utils/publicView';

const jogo = (
  id: string,
  inicio: string | null,
  status = 'encerrado',
  created = '2026-10-01T00:00:00Z',
  numero: number | null = null,
) => ({ id, inicio_previsto: inicio, status, created_at: created, numero_na_serie: numero }) as IJogoLista;

describe('latestFirst', () => {
  it('lists played games newest first, then the next ones soonest first', () => {
    const ordem = latestFirst([
      jogo('antigo', '2026-11-01T22:00:00Z'),
      jogo('sem-data-1', null, 'encerrado', '2026-11-02T00:00:00Z', 1),
      jogo('recente', '2026-11-08T23:30:00Z'),
      jogo('mesmo-dia-cedo', '2026-11-08T22:00:00Z'),
      jogo('sem-data-2', null, 'encerrado', '2026-11-02T00:00:00Z', 2),
      jogo('final-sem-data', null, 'pendente', '2026-11-10T00:00:00Z'),
      jogo('depois', '2026-11-20T22:00:00Z', 'agendado'),
      jogo('proximo', '2026-11-15T22:00:00Z', 'agendado'),
    ]).map((j) => j.id);
    expect(ordem).toEqual([
      'recente',
      'mesmo-dia-cedo',
      'antigo',
      'sem-data-2',
      'sem-data-1',
      'proximo',
      'depois',
      'final-sem-data',
    ]);
  });
});
