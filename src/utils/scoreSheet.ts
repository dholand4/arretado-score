import type { IResultadoInput, ISumula, ModoResultado, WoAusente } from '@/@types/game';

// Valores digitados por jogador e categoria; vazio = 0 (seção 6.5).
export type SheetValues = Record<string, Record<string, string>>;

export interface ISheetState {
  modo: ModoResultado;
  presentes: string[];
  valores: SheetValues;
  placarCasa: string;
  placarFora: string;
  ausente: WoAusente | '';
}

export function initialSheetState(sumula: ISumula): ISheetState {
  const { jogo } = sumula;
  const valores: SheetValues = {};
  for (const [jogadorId, porCategoria] of Object.entries(sumula.estatisticas)) {
    valores[jogadorId] = Object.fromEntries(Object.entries(porCategoria).map(([cat, v]) => [cat, String(v)]));
  }
  return {
    modo: jogo.status === 'wo' ? 'wo' : jogo.so_placar ? 'placar' : 'completa',
    presentes: sumula.presentes,
    valores,
    placarCasa: jogo.placar_casa?.toString() ?? '',
    placarFora: jogo.placar_fora?.toString() ?? '',
    ausente: jogo.wo_ausente ?? '',
  };
}

export function sortByNumber<T extends { numero: number | null; nome: string }>(jogadores: T[]): T[] {
  return [...jogadores].sort(
    (a, b) => (a.numero ?? Number.MAX_SAFE_INTEGER) - (b.numero ?? Number.MAX_SAFE_INTEGER) || a.nome.localeCompare(b.nome),
  );
}

// Placar ao vivo: soma da categoria de placar dos presentes do time.
export function teamScore(sumula: ISumula, state: ISheetState, timeId: string): number {
  const placar = sumula.categorias.find((c) => c.soma_no_placar);
  if (!placar) return 0;
  return sumula.jogadores
    .filter((j) => j.time_id === timeId && state.presentes.includes(j.id))
    .reduce((total, j) => total + (Number(state.valores[j.id]?.[placar.id]) || 0), 0);
}

export function displayedScore(sumula: ISumula, state: ISheetState): [string, string] {
  const { jogo, competicao } = sumula;
  if (state.modo === 'completa') {
    return [String(teamScore(sumula, state, jogo.time_casa_id)), String(teamScore(sumula, state, jogo.time_fora_id))];
  }
  if (state.modo === 'placar') return [state.placarCasa || '–', state.placarFora || '–'];
  if (state.ausente === 'ambos') return ['0', '0'];
  if (state.ausente === 'casa') return [String(competicao.wo_placar_perdedor), String(competicao.wo_placar_vencedor)];
  if (state.ausente === 'fora') return [String(competicao.wo_placar_vencedor), String(competicao.wo_placar_perdedor)];
  return ['–', '–'];
}

// Validações da seção 6.5 antes de chamar o banco (que valida de novo).
export function sheetError(sumula: ISumula, state: ISheetState): string | null {
  const empatePermitido = sumula.competicao.permite_empate && sumula.fase.tipo !== 'mata_mata';
  if (state.modo === 'wo') return state.ausente ? null : 'Informe quem faltou.';
  let casa: number;
  let fora: number;
  if (state.modo === 'placar') {
    if (state.placarCasa === '' || state.placarFora === '') return 'Informe o placar dos dois times.';
    casa = Number(state.placarCasa);
    fora = Number(state.placarFora);
    if (!Number.isInteger(casa) || !Number.isInteger(fora) || casa < 0 || fora < 0) {
      return 'O placar precisa ser um número inteiro, zero ou maior.';
    }
  } else {
    if (state.presentes.length === 0) return 'Marque quem jogou e lance as estatísticas.';
    casa = teamScore(sumula, state, sumula.jogo.time_casa_id);
    fora = teamScore(sumula, state, sumula.jogo.time_fora_id);
  }
  if (casa === fora && !empatePermitido) {
    return sumula.fase.tipo === 'mata_mata'
      ? 'No mata-mata sempre precisa haver vencedor.'
      : 'Esta competição não permite empate.';
  }
  return null;
}

export function buildResultInput(state: ISheetState): IResultadoInput {
  return {
    modo: state.modo,
    casa: state.modo === 'placar' ? Number(state.placarCasa) : null,
    fora: state.modo === 'placar' ? Number(state.placarFora) : null,
    ausente: state.modo === 'wo' && state.ausente ? state.ausente : null,
    jogadores:
      state.modo === 'completa'
        ? state.presentes.map((id) => ({
            jogador_id: id,
            valores: Object.fromEntries(
              Object.entries(state.valores[id] ?? {})
                .filter(([, v]) => v !== '')
                .map(([cat, v]) => [cat, Number(v)]),
            ),
          }))
        : [],
  };
}
