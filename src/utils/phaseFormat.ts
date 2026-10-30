import type {
  IConfronto,
  IFase,
  IFaseForm,
  IFasePayload,
  IOrigem,
  IPhaseIssue,
  ISerieConfig,
  ISummaryStep,
  TipoFase,
} from '@/@types/phase';
import { pluralize } from './text';

// Regras de formato das fases (seção 4.4 / 4.4.1). Espelham as validações da RPC salvar_fases,
// que continua sendo a fonte da verdade; aqui servem para avisar na hora e montar o resumo.

export interface IOrigemOption {
  key: string;
  origem: IOrigem;
  label: string;
}

export interface IPhaseAnalysis {
  // Times que entram na fase (null quando ainda não dá para saber).
  entram: number | null;
  // Times que avançam para a fase seguinte (null na última fase ou com erro).
  classificados: number | null;
  jogos: number | null;
  tamanhosGrupos: number[] | null;
  series: ISerieConfig[];
  origens: IOrigemOption[];
  confrontosNecessarios: number;
}

export interface IFormatAnalysis {
  phases: IPhaseAnalysis[];
  errors: IPhaseIssue[];
  warnings: IPhaseIssue[];
}

let keySeq = 0;
const nextKey = () => {
  keySeq += 1;
  return `fase-${keySeq}`;
};

// Nova fase com padrões sensatos: a primeira é todos contra todos; depois, mata-mata
// (por campanha, ou por vencedores quando a fase anterior também é mata-mata).
export function newPhase(index: number, previousTipo?: TipoFase): IFaseForm {
  return {
    key: nextKey(),
    nome: index === 0 ? 'Fase de classificação' : `Fase ${index + 1}`,
    tipo: index === 0 ? 'todos_contra_todos' : 'mata_mata',
    turnos: 1,
    qtd_grupos: 2,
    sorteio_grupos: 'aleatorio',
    classificam: null,
    melhores_extras: 0,
    melhor_de: 1,
    cruzamento: index === 0 ? null : previousTipo === 'mata_mata' ? 'vencedores' : 'por_campanha',
    disputa_terceiro: false,
    melhor_de_terceiro: null,
    confrontos: [],
    iniciada: false,
  };
}

export function phaseFromDb(fase: IFase): IFaseForm {
  const series = [...fase.series].sort((a, b) => serieNumber(a.codigo) - serieNumber(b.codigo));
  return {
    key: nextKey(),
    nome: fase.nome,
    tipo: fase.tipo,
    turnos: fase.turnos === 2 ? 2 : 1,
    qtd_grupos: fase.qtd_grupos ?? 2,
    sorteio_grupos: fase.sorteio_grupos,
    classificam: fase.classificam,
    melhores_extras: fase.melhores_extras,
    melhor_de: ([1, 3, 5, 7] as const).find((n) => n === fase.melhor_de) ?? 1,
    cruzamento: fase.cruzamento,
    disputa_terceiro: fase.disputa_terceiro,
    melhor_de_terceiro: ([1, 3, 5, 7] as const).find((n) => n === fase.melhor_de_terceiro) ?? null,
    confrontos: series
      .filter((s) => s.origem_a?.tipo !== 'perdedor')
      .map((s) => ({ origem_a: s.origem_a, origem_b: s.origem_b })),
    iniciada: fase.status !== 'aguardando',
  };
}

export function serieNumber(codigo: string): number {
  return Number(codigo.replace(/\D/g, '')) || 0;
}

export function roundRobinGames(times: number, turnos: number): number {
  return ((times * (times - 1)) / 2) * turnos;
}

// Grupos equilibrados: tamanhos diferem no máximo em 1 (os primeiros grupos ficam maiores).
export function groupSizes(times: number, grupos: number): number[] {
  const base = Math.floor(times / grupos);
  const maiores = times % grupos;
  return Array.from({ length: grupos }, (_, i) => base + (i < maiores ? 1 : 0));
}

export const groupName = (index: number) => String.fromCharCode(65 + index);

// Mesmo texto de validar_config_grupos (SQL).
export function groupsConfigIssue(
  times: number,
  grupos: number,
  classificam: number | null,
  extras: number,
): string | null {
  if (times < 2 * grupos) {
    return `Com ${times} times, cabem no máximo ${Math.floor(times / 2)} grupos (mínimo de 2 times por grupo).`;
  }
  if (classificam === null) return null;
  const base = Math.floor(times / grupos);
  const maiores = times % grupos;
  if (classificam > base) return `Avançam ${classificam} por grupo, mas o menor grupo terá ${base} times.`;
  const comExtra = classificam < base ? grupos : maiores;
  if (extras > comExtra) {
    return `Só ${comExtra} grupo(s) terão um ${classificam + 1}º colocado para disputar os melhores extras.`;
  }
  return null;
}

export function originKey(origem: IOrigem): string {
  switch (origem.tipo) {
    case 'posicao':
    case 'melhor_extra':
      return `${origem.tipo}:${origem.fase_ordem}:${origem.posicao}`;
    case 'posicao_grupo':
      return `${origem.tipo}:${origem.fase_ordem}:${origem.grupo}:${origem.posicao}`;
    default:
      return `${origem.tipo}:${origem.serie}`;
  }
}

// Rótulo curto, usado no resumo e nos confrontos ("1º x 4º", "1ºA x 2ºB", "Venc. S1").
export function originShort(origem: IOrigem, classificamAnterior?: number | null): string {
  switch (origem.tipo) {
    case 'posicao':
      return `${origem.posicao}º`;
    case 'posicao_grupo':
      return `${origem.posicao}º${origem.grupo}`;
    case 'melhor_extra':
      return `${origem.posicao}º melhor ${(classificamAnterior ?? 0) + 1}º`;
    case 'vencedor':
      return `Venc. ${origem.serie}`;
    case 'perdedor':
      return `Perd. ${origem.serie}`;
  }
}

// Rótulo completo ("1º colocado da Fase de classificação", "2º do grupo B", "Vencedor da S1").
export function originLabel(origem: IOrigem, nomeFaseAnterior: string, classificamAnterior?: number | null): string {
  switch (origem.tipo) {
    case 'posicao':
      return `${origem.posicao}º colocado da ${nomeFaseAnterior}`;
    case 'posicao_grupo':
      return `${origem.posicao}º do grupo ${origem.grupo}`;
    case 'melhor_extra':
      return `${origem.posicao}º melhor ${(classificamAnterior ?? 0) + 1}º colocado`;
    case 'vencedor':
      return `Vencedor da ${origem.serie}`;
    case 'perdedor':
      return `Perdedor da ${origem.serie}`;
  }
}

function availableOrigins(prev: IFaseForm, prevOrdem: number, prevCodes: string[]): IOrigemOption[] {
  const out: IOrigem[] = [];
  const classificam = prev.classificam ?? 0;
  if (prev.tipo === 'todos_contra_todos') {
    for (let k = 1; k <= classificam; k += 1) out.push({ tipo: 'posicao', fase_ordem: prevOrdem, posicao: k });
  } else if (prev.tipo === 'grupos') {
    for (let k = 1; k <= classificam; k += 1) {
      for (let g = 0; g < (prev.qtd_grupos ?? 0); g += 1) {
        out.push({ tipo: 'posicao_grupo', fase_ordem: prevOrdem, grupo: groupName(g), posicao: k });
      }
    }
    for (let k = 1; k <= prev.melhores_extras; k += 1) out.push({ tipo: 'melhor_extra', fase_ordem: prevOrdem, posicao: k });
  } else {
    prevCodes.forEach((serie) => out.push({ tipo: 'vencedor', serie }));
  }
  return out.map((origem) => ({
    key: originKey(origem),
    origem,
    label: originLabel(origem, prev.nome, prev.classificam),
  }));
}

const isPositiveInt = (value: number | null): value is number => value !== null && Number.isInteger(value) && value >= 1;

export function analyzeFormat(phases: IFaseForm[], teamsCount: number): IFormatAnalysis {
  const errors: IPhaseIssue[] = [];
  const warnings: IPhaseIssue[] = [];
  const result: IPhaseAnalysis[] = [];
  let prevCodes: string[] = [];
  let serieSeq = 0;

  if (phases.length === 0) errors.push({ phaseIndex: null, message: 'Adicione ao menos uma fase.' });

  phases.forEach((p, i) => {
    const isLast = i === phases.length - 1;
    const prev = i > 0 ? phases[i - 1] : null;
    const prevAnalysis = i > 0 ? result[i - 1] : null;
    // Na fase 1, os números dependem dos times cadastrados: viram avisos, conferidos de novo ao iniciar.
    const report = (field: IPhaseIssue['field'], message: string, soft = false) =>
      (soft ? warnings : errors).push({ phaseIndex: i, field, message });

    let entram: number | null = null;
    if (i === 0) {
      if (teamsCount >= 2) entram = teamsCount;
      else report(undefined, 'Cadastre ao menos 2 times para conferir os números da primeira fase.', true);
    } else {
      entram = prevAnalysis?.classificados ?? null;
      if (entram !== null && entram < 2) {
        report('tipo', `Chegam só ${pluralize(entram, 'time', 'times')} da fase anterior; são necessários ao menos 2.`);
        entram = null;
      }
    }

    const analysis: IPhaseAnalysis = {
      entram,
      classificados: null,
      jogos: null,
      tamanhosGrupos: null,
      series: [],
      origens: [],
      confrontosNecessarios: 0,
    };

    if (!p.nome.trim()) report('nome', 'Informe o nome da fase.');
    if (i === 0 && p.tipo === 'mata_mata') {
      report('tipo', 'A primeira fase precisa ser todos contra todos ou grupos.');
    }

    if (p.tipo === 'todos_contra_todos' || p.tipo === 'grupos') {
      if (!isLast && !isPositiveInt(p.classificam)) report('classificam', 'Informe quantos times avançam.');
    }

    if (p.tipo === 'todos_contra_todos') {
      if (entram !== null) {
        analysis.jogos = roundRobinGames(entram, p.turnos);
        if (!isLast && isPositiveInt(p.classificam) && p.classificam > entram) {
          report('classificam', `Avançam ${p.classificam} times, mas só ${entram} disputam a fase.`, i === 0);
        }
      }
      if (!isLast && isPositiveInt(p.classificam)) analysis.classificados = p.classificam;
    } else if (p.tipo === 'grupos') {
      const grupos = p.qtd_grupos;
      const gruposOk = isPositiveInt(grupos) && grupos >= 2;
      if (!gruposOk) report('qtd_grupos', 'Informe ao menos 2 grupos.');
      const extras = isLast ? 0 : p.melhores_extras;
      if (gruposOk && (!Number.isInteger(extras) || extras < 0 || extras >= grupos)) {
        report('melhores_extras', 'Os melhores extras precisam ser menos que o número de grupos.');
      }
      if (gruposOk && entram !== null) {
        analysis.tamanhosGrupos = groupSizes(entram, grupos);
        analysis.jogos = analysis.tamanhosGrupos.reduce((sum, size) => sum + roundRobinGames(size, p.turnos), 0);
        const issue = groupsConfigIssue(entram, grupos, isLast || !isPositiveInt(p.classificam) ? null : p.classificam, extras);
        if (issue) report('qtd_grupos', issue, i === 0);
      }
      if (!isLast && gruposOk && isPositiveInt(p.classificam)) analysis.classificados = p.classificam * grupos + extras;
    } else {
      buildKnockout(p, i, entram, prev, prevCodes, analysis, report, () => {
        serieSeq += 1;
        return `S${serieSeq}`;
      });
    }

    prevCodes = analysis.series.filter((s) => !s.terceiro).map((s) => s.codigo);
    result.push(analysis);
  });

  return { phases: result, errors, warnings };
}

function buildKnockout(
  p: IFaseForm,
  i: number,
  entram: number | null,
  prev: IFaseForm | null,
  prevCodes: string[],
  analysis: IPhaseAnalysis,
  report: (field: IPhaseIssue['field'], message: string) => void,
  nextCode: () => string,
) {
  if (!p.cruzamento) {
    report('cruzamento', 'Escolha como os confrontos são definidos.');
    return;
  }
  if (entram === null || !prev) return;
  if (entram % 2 !== 0) {
    report('tipo', `O mata-mata precisa de número par de times (chegam ${entram}).`);
    return;
  }
  const ordem = i; // ordem (1, 2…) da fase anterior
  const pares: [IOrigem, IOrigem][] = [];
  const n = entram / 2;

  if (p.cruzamento === 'por_campanha') {
    if (prev.tipo === 'mata_mata') {
      report('cruzamento', 'O cruzamento por campanha vale depois de uma fase de todos contra todos ou de grupos.');
      return;
    }
    for (let k = 1; k <= n; k += 1) {
      pares.push([
        { tipo: 'posicao', fase_ordem: ordem, posicao: k },
        { tipo: 'posicao', fase_ordem: ordem, posicao: entram + 1 - k },
      ]);
    }
  } else if (p.cruzamento === 'cruzado_grupos') {
    const grupos = prev.qtd_grupos ?? 0;
    if (prev.tipo !== 'grupos' || grupos % 2 !== 0 || prev.classificam !== 2 || prev.melhores_extras !== 0) {
      report(
        'cruzamento',
        'O cruzamento entre grupos exige, na fase anterior, um número par de grupos com 2 classificados cada e sem melhores extras.',
      );
      return;
    }
    for (let k = 0; k < grupos; k += 2) {
      const [x, y] = [groupName(k), groupName(k + 1)];
      pares.push([
        { tipo: 'posicao_grupo', fase_ordem: ordem, grupo: x, posicao: 1 },
        { tipo: 'posicao_grupo', fase_ordem: ordem, grupo: y, posicao: 2 },
      ]);
      pares.push([
        { tipo: 'posicao_grupo', fase_ordem: ordem, grupo: y, posicao: 1 },
        { tipo: 'posicao_grupo', fase_ordem: ordem, grupo: x, posicao: 2 },
      ]);
    }
  } else if (p.cruzamento === 'vencedores') {
    if (prev.tipo !== 'mata_mata') {
      report('cruzamento', 'O cruzamento por vencedores vale depois de outra fase de mata-mata.');
      return;
    }
    for (let k = 0; k < n; k += 1) {
      pares.push([
        { tipo: 'vencedor', serie: prevCodes[2 * k] },
        { tipo: 'vencedor', serie: prevCodes[2 * k + 1] },
      ]);
    }
  } else {
    analysis.origens = availableOrigins(prev, ordem, prevCodes);
    analysis.confrontosNecessarios = n;
    const disponiveis = new Set(analysis.origens.map((o) => o.key));
    const usadas = new Set<string>();
    let incompleto = false;
    let repetido = false;
    for (let k = 0; k < n; k += 1) {
      const c: IConfronto | undefined = p.confrontos[k];
      const lados = [c?.origem_a ?? null, c?.origem_b ?? null];
      if (lados.some((o) => !o || !disponiveis.has(originKey(o)))) {
        incompleto = true;
        continue;
      }
      lados.forEach((o) => {
        const key = originKey(o as IOrigem);
        if (usadas.has(key)) repetido = true;
        usadas.add(key);
      });
      pares.push([lados[0] as IOrigem, lados[1] as IOrigem]);
    }
    if (incompleto) report('confrontos', `Defina os ${n} confrontos com origens válidas.`);
    if (repetido) report('confrontos', 'Cada origem só pode aparecer em um confronto.');
    if (incompleto || repetido) return;
  }

  analysis.series = pares.map(([a, b]) => ({ codigo: nextCode(), origem_a: a, origem_b: b, terceiro: false }));
  analysis.classificados = n;

  if (p.disputa_terceiro) {
    const final = analysis.series[0];
    if (entram !== 2 || final.origem_a.tipo !== 'vencedor' || final.origem_b.tipo !== 'vencedor') {
      report('disputa_terceiro', 'A disputa de 3º lugar só vale na final, quando os finalistas vêm de séries do mata-mata.');
      return;
    }
    analysis.series.push({
      codigo: nextCode(),
      origem_a: { tipo: 'perdedor', serie: final.origem_a.serie },
      origem_b: { tipo: 'perdedor', serie: final.origem_b.serie },
      terceiro: true,
    });
  }
}

const TIPO_RESUMO: Record<Exclude<TipoFase, 'mata_mata'>, string> = {
  todos_contra_todos: 'todos contra todos',
  grupos: 'grupos',
};

function melhorDeLabel(melhorDe: number): string {
  return melhorDe === 1 ? 'jogo único' : `melhor de ${melhorDe}`;
}

// Resumo visual (seção 5): "Fase 1: 5 times, todos contra todos, 10 jogos → 4 avançam → Semifinal melhor de 3: 1º x 4º, 2º x 3º → Final melhor de 3".
export function buildFormatSummary(phases: IFaseForm[], analysis: IFormatAnalysis): ISummaryStep[] {
  const steps: ISummaryStep[] = [];
  phases.forEach((p, i) => {
    const a = analysis.phases[i];
    const isLast = i === phases.length - 1;
    const nome = p.nome.trim() || `Fase ${i + 1}`;
    const turnos = p.turnos === 2 ? ' em 2 turnos' : '';
    const jogos = a?.jogos !== null && a?.jogos !== undefined ? `, ${pluralize(a.jogos, 'jogo', 'jogos')}` : '';

    if (p.tipo === 'mata_mata') {
      const confrontos =
        p.cruzamento !== 'vencedores' && a && a.series.length > 0
          ? `: ${a.series
              .filter((s) => !s.terceiro)
              .map((s) => `${originShort(s.origem_a, phases[i - 1]?.classificam)} x ${originShort(s.origem_b, phases[i - 1]?.classificam)}`)
              .join(', ')}`
          : '';
      const terceiro = p.disputa_terceiro
        ? ` + disputa de 3º lugar${p.melhor_de_terceiro && p.melhor_de_terceiro !== p.melhor_de ? ` (${melhorDeLabel(p.melhor_de_terceiro)})` : ''}`
        : '';
      steps.push({ kind: 'fase', label: `${nome} ${melhorDeLabel(p.melhor_de)}${confrontos}${terceiro}` });
      return;
    }

    const times = a?.entram !== null && a?.entram !== undefined ? `${pluralize(a.entram, 'time', 'times')}, ` : '';
    const descricao =
      p.tipo === 'grupos'
        ? `${times}${pluralize(p.qtd_grupos ?? 0, 'grupo', 'grupos')}${turnos}`
        : `${times}${TIPO_RESUMO[p.tipo]}${turnos}`;
    steps.push({ kind: 'fase', label: `${nome}: ${descricao}${jogos}` });

    if (!isLast && a?.classificados) {
      const detalhe =
        p.tipo === 'grupos'
          ? ` (${p.classificam} por grupo${p.melhores_extras ? ` + ${p.melhores_extras} ${p.melhores_extras === 1 ? 'melhor' : 'melhores'} ${(p.classificam ?? 0) + 1}º` : ''})`
          : '';
      steps.push({
        kind: 'transicao',
        label: `${a.classificados} ${a.classificados === 1 ? 'avança' : 'avançam'}${detalhe}`,
      });
    }
  });
  return steps;
}

export function summaryText(steps: ISummaryStep[]): string {
  return steps.map((s) => s.label).join(' → ');
}

export function toPayload(phases: IFaseForm[]): IFasePayload[] {
  return phases.map((p, i) => {
    const isLast = i === phases.length - 1;
    const base: IFasePayload = {
      nome: p.nome.trim(),
      tipo: p.tipo,
      turnos: p.tipo === 'mata_mata' ? 1 : p.turnos,
      qtd_grupos: p.tipo === 'grupos' ? p.qtd_grupos : null,
      sorteio_grupos: p.tipo === 'grupos' ? p.sorteio_grupos : 'aleatorio',
      classificam: p.tipo === 'mata_mata' || isLast ? null : p.classificam,
      melhores_extras: p.tipo === 'grupos' && !isLast ? p.melhores_extras : 0,
      melhor_de: p.tipo === 'mata_mata' ? p.melhor_de : 1,
      cruzamento: p.tipo === 'mata_mata' ? p.cruzamento : null,
      disputa_terceiro: p.tipo === 'mata_mata' ? p.disputa_terceiro : false,
      melhor_de_terceiro: p.tipo === 'mata_mata' && p.disputa_terceiro ? p.melhor_de_terceiro : null,
    };
    if (p.tipo === 'mata_mata' && p.cruzamento === 'manual') {
      base.confrontos = p.confrontos
        .filter((c): c is { origem_a: IOrigem; origem_b: IOrigem } => Boolean(c.origem_a && c.origem_b))
        .map((c) => ({ origem_a: c.origem_a, origem_b: c.origem_b }));
    }
    return base;
  });
}

export function issuesFor(issues: IPhaseIssue[], phaseIndex: number) {
  const byField: Partial<Record<NonNullable<IPhaseIssue['field']>, string>> = {};
  const general: string[] = [];
  issues
    .filter((issue) => issue.phaseIndex === phaseIndex)
    .forEach((issue) => {
      if (issue.field && !byField[issue.field]) byField[issue.field] = issue.message;
      else if (!issue.field) general.push(issue.message);
    });
  return { byField, general };
}
