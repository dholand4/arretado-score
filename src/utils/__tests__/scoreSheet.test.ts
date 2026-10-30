import type { IJogoLista, ISumula } from '@/@types/game';
import { describeGame, filterGames, gameStatus, hasResult } from '@/utils/games';
import {
  buildResultInput,
  displayedScore,
  initialSheetState,
  sheetError,
  sortByNumber,
  teamScore,
} from '@/utils/scoreSheet';

const sumula = (overrides: Partial<ISumula> = {}): ISumula => ({
  jogo: {
    id: 'g1',
    time_casa_id: 'casa',
    time_fora_id: 'fora',
    status: 'agendado',
    so_placar: false,
    placar_casa: null,
    placar_fora: null,
    wo_ausente: null,
  } as ISumula['jogo'],
  casa: 'Falcões',
  fora: 'Trovão',
  competicao: { id: 'c', permite_empate: false, wo_placar_vencedor: 20, wo_placar_perdedor: 0 },
  fase: { id: 'f', nome: 'Fase 1', tipo: 'todos_contra_todos' },
  edicaoRestrita: false,
  jogadores: [
    { id: 'a1', time_id: 'casa', nome: 'Bruno', apelido: null, numero: 10 },
    { id: 'a2', time_id: 'casa', nome: 'Ana', apelido: null, numero: 4 },
    { id: 'b1', time_id: 'fora', nome: 'Caio', apelido: null, numero: null },
  ],
  categorias: [
    { id: 'pts', nome: 'Pontos', sigla: 'PTS', soma_no_placar: true },
    { id: 'reb', nome: 'Rebotes', sigla: 'REB', soma_no_placar: false },
  ],
  presentes: [],
  estatisticas: {},
  ...overrides,
});

describe('scoreSheet utils', () => {
  it('starts from the saved result', () => {
    const s = sumula({
      jogo: { ...sumula().jogo, status: 'wo', wo_ausente: 'fora', placar_casa: 20, placar_fora: 0 },
      presentes: ['a1'],
      estatisticas: { a1: { pts: 12 } },
    });
    const state = initialSheetState(s);
    expect(state.modo).toBe('wo');
    expect(state.ausente).toBe('fora');
    expect(state.valores.a1.pts).toBe('12');
  });

  it('sums only present players of the score category', () => {
    const s = sumula();
    const state = { ...initialSheetState(s), presentes: ['a1'], valores: { a1: { pts: '8', reb: '5' }, a2: { pts: '6' } } };
    expect(teamScore(s, state, 'casa')).toBe(8);
    expect(displayedScore(s, state)).toEqual(['8', '0']);
  });

  it('shows the automatic W.O. score', () => {
    const s = sumula();
    expect(displayedScore(s, { ...initialSheetState(s), modo: 'wo', ausente: 'casa' })).toEqual(['0', '20']);
    expect(displayedScore(s, { ...initialSheetState(s), modo: 'wo', ausente: 'ambos' })).toEqual(['0', '0']);
  });

  it('validates draws, missing data and knockout games', () => {
    const s = sumula();
    const base = initialSheetState(s);
    expect(sheetError(s, base)).toMatch(/Marque quem jogou/);
    expect(sheetError(s, { ...base, modo: 'placar', placarCasa: '3', placarFora: '3' })).toMatch(/não permite empate/);
    expect(sheetError(s, { ...base, modo: 'wo' })).toMatch(/quem faltou/);
    const mata = sumula({ competicao: { ...s.competicao, permite_empate: true }, fase: { ...s.fase, tipo: 'mata_mata' } });
    expect(sheetError(mata, { ...base, modo: 'placar', placarCasa: '1', placarFora: '1' })).toMatch(/mata-mata/);
    expect(sheetError(s, { ...base, modo: 'placar', placarCasa: '3', placarFora: '1' })).toBeNull();
  });

  it('builds the RPC payload without blank values', () => {
    const s = sumula();
    const state = { ...initialSheetState(s), presentes: ['a1'], valores: { a1: { pts: '8', reb: '' } } };
    expect(buildResultInput(state)).toEqual({
      modo: 'completa',
      casa: null,
      fora: null,
      ausente: null,
      jogadores: [{ jogador_id: 'a1', valores: { pts: 8 } }],
    });
    expect(buildResultInput({ ...state, modo: 'placar', placarCasa: '10', placarFora: '7' }).jogadores).toEqual([]);
  });

  it('orders players by shirt number, without number last', () => {
    expect(sortByNumber(sumula().jogadores).map((j) => j.nome)).toEqual(['Ana', 'Bruno', 'Caio']);
  });
});

describe('games utils', () => {
  const jogo = (overrides: Partial<IJogoLista>) =>
    ({
      id: 'g',
      fase_id: 'f1',
      time_casa_id: 't1',
      time_fora_id: 't2',
      status: 'pendente',
      rodada: 1,
      numero_na_serie: null,
      inicio_previsto: null,
      fase: { nome: 'Fase 1' },
      grupo: null,
      serie: null,
      evento: null,
      ...overrides,
    }) as IJogoLista;

  it('filters by phase, team and status', () => {
    const jogos = [jogo({ id: 'a' }), jogo({ id: 'b', time_fora_id: 't3', status: 'encerrado' })];
    expect(filterGames(jogos, { faseId: '', timeId: 't3', status: '' }).map((j) => j.id)).toEqual(['b']);
    expect(filterGames(jogos, { faseId: 'f1', timeId: '', status: 'pendente' }).map((j) => j.id)).toEqual(['a']);
  });

  it('describes and labels games', () => {
    expect(describeGame(jogo({}))).toBe('Fase 1 · Rodada 1 · Sem data');
    expect(describeGame(jogo({ serie: { codigo: 'S1' }, numero_na_serie: 2, evento: { data: '2026-10-25', local: 'Ginásio', status: 'publicado' } })))
      .toBe('Fase 1 · S1 · Jogo 2 · Sem data · Ginásio');
    expect(gameStatus('wo')).toEqual({ label: 'W.O.', tone: 'warning' });
    expect(hasResult({ status: 'encerrado' })).toBe(true);
  });
});
