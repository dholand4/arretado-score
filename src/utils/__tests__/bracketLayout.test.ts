import type { IBracketPhase } from '@/hooks/usePublicBracket';
import { buildBracketLayout } from '@/utils/bracketLayout';

type Origem = { tipo: string; serie?: string; posicao?: number; fase_ordem?: number };

const series = (id: string, origem_a: Origem, origem_b: Origem) => ({
  id,
  codigo: id.toUpperCase(),
  fase_id: '',
  origem_a,
  origem_b,
  melhor_de: 1,
  time_a_id: null,
  time_b_id: null,
  vitorias_a: 0,
  vitorias_b: 0,
  vencedor_id: null,
  status: 'aguardando',
  created_at: '',
  nameA: 'A definir',
  nameB: 'A definir',
  games: [],
});

const phase = (nome: string, list: ReturnType<typeof series>[]) =>
  ({ id: nome, nome, ordem: 0, disputa_terceiro: false, series: list }) as unknown as IBracketPhase;

describe('buildBracketLayout', () => {
  it('shows the 3rd place when it is its own phase before the final', () => {
    const layout = buildBracketLayout([
      phase('Semifinal', [
        series('s1', { tipo: 'posicao', fase_ordem: 1, posicao: 1 }, { tipo: 'posicao', fase_ordem: 1, posicao: 4 }),
        series('s2', { tipo: 'posicao', fase_ordem: 1, posicao: 2 }, { tipo: 'posicao', fase_ordem: 1, posicao: 3 }),
      ]),
      phase('3º lugar', [series('s3', { tipo: 'perdedor', serie: 'S1' }, { tipo: 'perdedor', serie: 'S2' })]),
      phase('Final', [series('s4', { tipo: 'vencedor', serie: 'S1' }, { tipo: 'vencedor', serie: 'S2' })]),
    ]);
    expect(layout.final?.code).toBe('S4');
    expect(layout.third?.code).toBe('S3');
    expect(layout.left.map((column) => column.title)).toEqual(['Semifinal']);
    expect(layout.right.map((column) => column.matches[0].code)).toEqual(['S2']);
  });
});
