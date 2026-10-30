import type { Json } from '@/@types/database';
import type { IBracketPhase } from '@/hooks/usePublicBracket';

type BracketSeries = IBracketPhase['series'][number];

export interface IBracketTeam {
  name: string;
  // Vitórias na série (melhor de 3+) ou pontos do jogo (melhor de 1); nulo antes de jogar.
  score: number | null;
  winner: boolean;
  defined: boolean;
}

export interface IBracketMatch {
  id: string;
  code: string;
  bestOf: number;
  teamA: IBracketTeam;
  teamB: IBracketTeam;
  games: string[];
}

export interface IBracketColumn {
  title: string;
  matches: IBracketMatch[];
}

export interface IBracketLayout {
  // Colunas de fora para dentro (a última encosta na final).
  left: IBracketColumn[];
  right: IBracketColumn[];
  finalTitle: string;
  final: IBracketMatch | null;
  third: IBracketMatch | null;
}

const originOf = (origin: Json | null) =>
  origin && typeof origin === 'object' && !Array.isArray(origin) ? origin : null;

const isThirdPlace = (series: BracketSeries) => originOf(series.origem_a)?.tipo === 'perdedor';

const seriesNumber = (code: string) => Number(code.replace(/\D/g, '')) || 0;

function toMatch(series: BracketSeries): IBracketMatch {
  const finished = series.games.filter((game) => game.status === 'encerrado' || game.status === 'wo');
  const singleGame = series.melhor_de === 1 ? finished[0] : undefined;
  const pointsOf = (teamId: string | null) => {
    if (!singleGame || !teamId) return null;
    return singleGame.time_casa_id === teamId ? singleGame.placar_casa : singleGame.placar_fora;
  };
  const started = finished.length > 0;
  const team = (id: string | null, name: string, wins: number): IBracketTeam => ({
    name,
    score: series.melhor_de === 1 ? pointsOf(id) : started ? wins : null,
    winner: Boolean(series.vencedor_id) && series.vencedor_id === id,
    defined: Boolean(id),
  });
  return {
    id: series.id,
    code: series.codigo,
    bestOf: series.melhor_de,
    teamA: team(series.time_a_id, series.nameA, series.vitorias_a),
    teamB: team(series.time_b_id, series.nameB, series.vitorias_b),
    games: series.games.map(
      (game) => `Jogo ${game.numero_na_serie}: ${game.home} ${game.placar_casa ?? '–'} × ${game.placar_fora ?? '–'} ${game.away}`,
    ),
  };
}

// Monta a chave em dois lados a partir da final: o lado A segue a origem do time A da final
// e o lado B a do time B, rodada por rodada (cada fase de mata-mata é uma rodada).
export function buildBracketLayout(phases: IBracketPhase[]): IBracketLayout {
  const empty: IBracketLayout = { left: [], right: [], finalTitle: 'Final', final: null, third: null };
  const lastPhase = phases.at(-1);
  const final = lastPhase?.series.find((series) => !isThirdPlace(series));
  if (!lastPhase || !final) return empty;

  const byCode = new Map(phases.flatMap((phase) => phase.series.map((series) => [series.codigo, series] as const)));
  const phaseOf = new Map(phases.flatMap((phase) => phase.series.map((series) => [series.id, phase] as const)));
  const lastIndex = phases.length - 1;
  const sides = { left: new Map<number, BracketSeries[]>(), right: new Map<number, BracketSeries[]>() };
  const placed = new Set<string>([final.id]);

  const place = (side: 'left' | 'right', origin: Json | null) => {
    const ref = originOf(origin);
    if (ref?.tipo !== 'vencedor' || typeof ref.serie !== 'string') return;
    const series = byCode.get(ref.serie);
    const phase = series && phaseOf.get(series.id);
    if (!series || !phase || placed.has(series.id)) return;
    placed.add(series.id);
    const depth = lastIndex - phases.indexOf(phase);
    // Primeiro os confrontos de cima (origem A), para a chave seguir a ordem natural.
    place(side, series.origem_a);
    place(side, series.origem_b);
    sides[side].set(depth, [...(sides[side].get(depth) ?? []), series]);
  };
  place('left', final.origem_a);
  place('right', final.origem_b);

  // Séries sem ligação com a final (não deveria acontecer) vão para o lado com menos jogos na rodada.
  phases.slice(0, -1).forEach((phase, index) => {
    const depth = lastIndex - index;
    for (const series of [...phase.series].sort((a, b) => seriesNumber(a.codigo) - seriesNumber(b.codigo))) {
      if (placed.has(series.id) || isThirdPlace(series)) continue;
      const side = (sides.left.get(depth)?.length ?? 0) <= (sides.right.get(depth)?.length ?? 0) ? 'left' : 'right';
      sides[side].set(depth, [...(sides[side].get(depth) ?? []), series]);
    }
  });

  const columns = (side: 'left' | 'right') =>
    [...sides[side].entries()]
      .sort(([a], [b]) => b - a)
      .map(([depth, series]) => ({ title: phases[lastIndex - depth].nome, matches: series.map(toMatch) }));

  const third = lastPhase.series.find(isThirdPlace);
  return {
    left: columns('left'),
    right: columns('right'),
    finalTitle: lastPhase.nome,
    final: toMatch(final),
    third: third ? toMatch(third) : null,
  };
}
