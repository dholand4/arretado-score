import type { Json } from '@/@types/database';
import type { IBracketPhase } from '@/hooks/usePublicBracket';

type BracketSeries = IBracketPhase['series'][number];

export interface IBracketTeam {
  name: string;
  logo: string | null;
  // Vitórias na série (melhor de 3+) ou pontos do jogo (melhor de 1); nulo antes de jogar.
  score: number | null;
  winner: boolean;
  defined: boolean;
}

// Um jogo da série, para a lista que abre ao clicar no confronto.
export interface IBracketGame {
  id: string;
  number: number | null;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  startsAt: string | null;
}

export interface IBracketMatch {
  id: string;
  code: string;
  // Nome da fase da série (título da lista de jogos).
  phase: string;
  bestOf: number;
  // Série com jogo já disputado e sem vencedor ainda.
  live: boolean;
  teamA: IBracketTeam;
  teamB: IBracketTeam;
  games: IBracketGame[];
}

export interface IBracketColumn {
  title: string;
  matches: IBracketMatch[];
}

export interface IBracketLayout {
  // Fases que não se ligam à chave por "vencedor da série X" (ex.: 3 séries que avançam pela campanha):
  // aparecem em faixas acima dela, da primeira para a última.
  rounds: IBracketColumn[];
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

function toMatch(series: BracketSeries, phase: string): IBracketMatch {
  const finished = series.games.filter((game) => game.status === 'encerrado' || game.status === 'wo');
  const singleGame = series.melhor_de === 1 ? finished[0] : undefined;
  const pointsOf = (teamId: string | null) => {
    if (!singleGame || !teamId) return null;
    return singleGame.time_casa_id === teamId ? singleGame.placar_casa : singleGame.placar_fora;
  };
  const started = finished.length > 0;
  const team = (id: string | null, name: string, logo: string | null, wins: number): IBracketTeam => ({
    name,
    logo,
    score: series.melhor_de === 1 ? pointsOf(id) : started ? wins : null,
    winner: Boolean(series.vencedor_id) && series.vencedor_id === id,
    defined: Boolean(id),
  });
  return {
    id: series.id,
    code: series.codigo,
    phase,
    bestOf: series.melhor_de,
    live: started && !series.vencedor_id,
    teamA: team(series.time_a_id, series.nameA, series.logoA, series.vitorias_a),
    teamB: team(series.time_b_id, series.nameB, series.logoB, series.vitorias_b),
    games: series.games.map((game) => ({
      id: game.id,
      number: game.numero_na_serie,
      home: game.home,
      away: game.away,
      homeScore: game.placar_casa,
      awayScore: game.placar_fora,
      status: game.status,
      startsAt: game.inicio_previsto,
    })),
  };
}

// Monta a chave em dois lados a partir da final: o lado A segue a origem do time A da final
// e o lado B a do time B, rodada por rodada (cada fase de mata-mata é uma rodada).
export function buildBracketLayout(phases: IBracketPhase[]): IBracketLayout {
  const empty: IBracketLayout = { rounds: [], left: [], right: [], finalTitle: 'Final', final: null, third: null };
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

  // Fase sem nenhuma série ligada à final (avança pela campanha) vira uma faixa acima da chave.
  // Numa fase ligada em parte, as séries soltas vão para o lado com menos jogos na rodada.
  const rounds: IBracketColumn[] = [];
  phases.slice(0, -1).forEach((phase, index) => {
    const depth = lastIndex - index;
    const sorted = [...phase.series].sort((a, b) => seriesNumber(a.codigo) - seriesNumber(b.codigo));
    const loose = sorted.filter((series) => !placed.has(series.id) && !isThirdPlace(series));
    if (loose.length > 0 && !sorted.some((series) => placed.has(series.id))) {
      rounds.push({ title: phase.nome, matches: loose.map((series) => toMatch(series, phase.nome)) });
      return;
    }
    for (const series of loose) {
      const side = (sides.left.get(depth)?.length ?? 0) <= (sides.right.get(depth)?.length ?? 0) ? 'left' : 'right';
      sides[side].set(depth, [...(sides[side].get(depth) ?? []), series]);
    }
  });

  const columns = (side: 'left' | 'right') =>
    [...sides[side].entries()]
      .sort(([a], [b]) => b - a)
      .map(([depth, series]) => {
        const nome = phases[lastIndex - depth].nome;
        return { title: nome, matches: series.map((item) => toMatch(item, nome)) };
      });

  // 3º lugar: série com perdedores, na final (formato antigo) ou numa fase própria antes dela.
  const third = [...phases].reverse().flatMap((phase) => phase.series).find(isThirdPlace);
  return {
    rounds,
    left: columns('left'),
    right: columns('right'),
    finalTitle: lastPhase.nome,
    final: toMatch(final, lastPhase.nome),
    third: third ? toMatch(third, phaseOf.get(third.id)?.nome ?? 'Disputa de 3º lugar') : null,
  };
}
