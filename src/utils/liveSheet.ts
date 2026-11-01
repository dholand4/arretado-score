import type { IJogadorMesa, ILance, IRegrasPartida, IRelogio, LadoMesa, TipoFalta } from '@/@types/liveSheet';

// Cálculos da súmula ao vivo (seção 6.5.1). Tudo sai dos lances não anulados.

const MS_MINUTO = 60_000;

export const TIPO_FALTA_LABEL: Record<TipoFalta, string> = {
  pessoal: 'Falta',
  tecnica: 'Falta técnica',
  antidesportiva: 'Falta antidesportiva',
  desqualificante: 'Falta desqualificante',
};

export function isOvertime(periodo: number, regras: Pick<IRegrasPartida, 'qtd_periodos'>): boolean {
  return periodo > regras.qtd_periodos;
}

export function periodDurationMs(periodo: number, regras: IRegrasPartida): number {
  return (isOvertime(periodo, regras) ? regras.duracao_prorrogacao_min : regras.duracao_periodo_min) * MS_MINUTO;
}

export function periodLabel(periodo: number, regras: Pick<IRegrasPartida, 'qtd_periodos'>): string {
  if (!isOvertime(periodo, regras)) return `${periodo}º período`;
  const extra = periodo - regras.qtd_periodos;
  return extra === 1 ? 'Prorrogação' : `${extra}ª prorrogação`;
}

export function periodShortLabel(periodo: number, regras: Pick<IRegrasPartida, 'qtd_periodos'>): string {
  return isOvertime(periodo, regras) ? `PR${periodo - regras.qtd_periodos}` : `${periodo}º`;
}

// Quanto falta agora, partindo do valor guardado na referência.
export function remainingAt(valorMs: number, relogio: Pick<IRelogio, 'rodando' | 'referenciaMs'>, agoraMs: number) {
  if (!relogio.rodando) return Math.max(0, valorMs);
  return Math.max(0, valorMs - (agoraMs - relogio.referenciaMs));
}

export function clockAt(relogio: IRelogio, agoraMs: number): { jogoMs: number; posseMs: number | null } {
  return {
    jogoMs: remainingAt(relogio.restanteMs, relogio, agoraMs),
    posseMs: relogio.posseMs === null ? null : remainingAt(relogio.posseMs, relogio, agoraMs),
  };
}

// Congela os relógios no instante `agoraMs` (a nova referência).
export function snapshotClock(relogio: IRelogio, agoraMs: number): IRelogio {
  const { jogoMs, posseMs } = clockAt(relogio, agoraMs);
  return { ...relogio, restanteMs: jogoMs, posseMs, referenciaMs: agoraMs };
}

// Cronômetro de jogo: mm:ss; no último minuto, segundos com décimos (como no placar eletrônico).
export function formatGameClock(ms: number): string {
  if (ms < MS_MINUTO) return (Math.floor(ms / 100) / 10).toFixed(1);
  const totalSegundos = Math.ceil(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  return `${String(minutos).padStart(2, '0')}:${String(totalSegundos % 60).padStart(2, '0')}`;
}

// Relógio de posse: segundos inteiros; abaixo de 5, com décimos.
export function formatShotClock(ms: number): string {
  if (ms < 5000) return (Math.floor(ms / 100) / 10).toFixed(1);
  return String(Math.ceil(ms / 1000));
}

export function formatLanceTime(ms: number): string {
  const totalSegundos = Math.ceil(ms / 1000);
  return `${String(Math.floor(totalSegundos / 60)).padStart(2, '0')}:${String(totalSegundos % 60).padStart(2, '0')}`;
}

export function timeoutLimit(periodo: number, regras: IRegrasPartida): number {
  if (isOvertime(periodo, regras)) return regras.tempos_prorrogacao;
  return periodo <= Math.ceil(regras.qtd_periodos / 2) ? regras.tempos_primeira_metade : regras.tempos_segunda_metade;
}

// Tempos debitados contam por metade do jogo; cada prorrogação tem a sua cota.
function sameTimeoutBlock(a: number, b: number, regras: IRegrasPartida): boolean {
  if (isOvertime(a, regras) || isOvertime(b, regras)) return a === b;
  const metade = Math.ceil(regras.qtd_periodos / 2);
  return a <= metade === b <= metade;
}

// Faltas da equipe: as prorrogações contam junto com o último período.
function teamFoulPeriod(periodo: number, regras: IRegrasPartida): number {
  return Math.min(periodo, regras.qtd_periodos);
}

export interface IResumoJogador {
  pontos: number;
  faltas: number;
  // Técnicas + antidesportivas: com 2, o jogador é desqualificado.
  graves: number;
  desqualificado: boolean;
  excluido: boolean;
}

export interface IResumoMesa {
  placar: Record<LadoMesa, number>;
  porPeriodo: { periodo: number; casa: number; fora: number }[];
  jogadores: Record<string, IResumoJogador>;
  faltasEquipe: Record<LadoMesa, number>;
  emBonus: Record<LadoMesa, boolean>;
  temposUsados: Record<LadoMesa, number>;
  temposLimite: number;
}

export function summarizeLive(
  lances: ILance[],
  periodoAtual: number,
  regras: IRegrasPartida,
  times: Record<LadoMesa, string>,
): IResumoMesa {
  const lado = (timeId: string): LadoMesa => (timeId === times.casa ? 'casa' : 'fora');
  const placar = { casa: 0, fora: 0 };
  const porPeriodo = new Map<number, { casa: number; fora: number }>();
  const jogadores: Record<string, IResumoJogador> = {};
  const faltasEquipe = { casa: 0, fora: 0 };
  const temposUsados = { casa: 0, fora: 0 };

  for (let p = 1; p <= Math.max(periodoAtual, regras.qtd_periodos); p += 1) porPeriodo.set(p, { casa: 0, fora: 0 });

  for (const lance of lances) {
    if (lance.anulado) continue;
    const l = lado(lance.time_id);
    const jogador = lance.jogador_id
      ? (jogadores[lance.jogador_id] ??= { pontos: 0, faltas: 0, graves: 0, desqualificado: false, excluido: false })
      : null;
    if (lance.tipo === 'ponto' && lance.valor) {
      placar[l] += lance.valor;
      const parcial = porPeriodo.get(lance.periodo) ?? { casa: 0, fora: 0 };
      parcial[l] += lance.valor;
      porPeriodo.set(lance.periodo, parcial);
      if (jogador) jogador.pontos += lance.valor;
    } else if (lance.tipo === 'falta') {
      if (jogador) {
        jogador.faltas += 1;
        if (lance.tipo_falta === 'tecnica' || lance.tipo_falta === 'antidesportiva') jogador.graves += 1;
        if (lance.tipo_falta === 'desqualificante') jogador.desqualificado = true;
      }
      if (teamFoulPeriod(lance.periodo, regras) === teamFoulPeriod(periodoAtual, regras)) faltasEquipe[l] += 1;
    } else if (lance.tipo === 'tempo' && sameTimeoutBlock(lance.periodo, periodoAtual, regras)) {
      temposUsados[l] += 1;
    }
  }

  for (const resumo of Object.values(jogadores)) {
    resumo.excluido = resumo.desqualificado || resumo.graves >= 2 || resumo.faltas >= regras.faltas_exclusao_jogador;
  }

  return {
    placar,
    porPeriodo: [...porPeriodo.entries()].sort(([a], [b]) => a - b).map(([periodo, v]) => ({ periodo, ...v })),
    jogadores,
    faltasEquipe,
    emBonus: {
      casa: faltasEquipe.casa >= regras.faltas_bonus_equipe,
      fora: faltasEquipe.fora >= regras.faltas_bonus_equipe,
    },
    temposUsados,
    temposLimite: timeoutLimit(periodoAtual, regras),
  };
}

export type ProximoPasso = 'proximo_periodo' | 'prorrogacao' | 'fim';

// O que vem depois do período atual: no fim do tempo normal, empate sem empate permitido vai à prorrogação.
export function nextStep(
  periodo: number,
  regras: Pick<IRegrasPartida, 'qtd_periodos'>,
  placar: Record<LadoMesa, number>,
  empatePermitido: boolean,
): ProximoPasso {
  if (periodo < regras.qtd_periodos) return 'proximo_periodo';
  return placar.casa === placar.fora && !empatePermitido ? 'prorrogacao' : 'fim';
}

export function playerLabel(jogador: Pick<IJogadorMesa, 'nome' | 'apelido' | 'numero'>): string {
  const nome = jogador.apelido || jogador.nome;
  return jogador.numero === null ? nome : `#${jogador.numero} ${nome}`;
}

export function describeLance(lance: ILance, jogador: IJogadorMesa | undefined, time: string): string {
  const quem = jogador ? playerLabel(jogador) : time;
  if (lance.tipo === 'ponto') return `+${lance.valor} ${quem}`;
  if (lance.tipo === 'falta') return `${TIPO_FALTA_LABEL[lance.tipo_falta ?? 'pessoal']} — ${quem}`;
  return `Tempo debitado — ${time}`;
}

// Junta os lances do servidor com a fila do aparelho: lances pendentes no fim e anulações já aplicadas.
export function mergeLances(servidor: ILance[], pendentes: ILance[], anulados: string[]): ILance[] {
  const ids = new Set(servidor.map((l) => l.id));
  const anuladosSet = new Set(anulados);
  return [...servidor, ...pendentes.filter((l) => !ids.has(l.id)).map((l) => ({ ...l, pendente: true }))].map((l) =>
    anuladosSet.has(l.id) ? { ...l, anulado: true } : l,
  );
}
