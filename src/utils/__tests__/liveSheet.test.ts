import type { ILance, IRegrasPartida } from '@/@types/liveSheet';
import {
  clockAt,
  formatGameClock,
  formatShotClock,
  mergeLances,
  nextStep,
  periodLabel,
  snapshotClock,
  summarizeLive,
  timeoutLimit,
  unseenConfirmations,
} from '@/utils/liveSheet';

const regras: IRegrasPartida = {
  qtd_periodos: 4,
  duracao_periodo_min: 10,
  duracao_prorrogacao_min: 5,
  faltas_bonus_equipe: 4,
  faltas_exclusao_jogador: 5,
  tempos_primeira_metade: 2,
  tempos_segunda_metade: 3,
  tempos_prorrogacao: 1,
  relogio_posse: true,
  posse_segundos: 24,
  posse_reset_curto: 14,
};

const times = { casa: 'A', fora: 'B' };
let seq = 0;
const lance = (patch: Partial<ILance>): ILance => ({
  id: `l${(seq += 1)}`,
  jogo_id: 'j',
  periodo: 1,
  tempo_restante_ms: 0,
  tipo: 'ponto',
  time_id: 'A',
  jogador_id: 'a1',
  valor: 2,
  tipo_falta: null,
  anulado: false,
  ...patch,
});
const falta = (patch: Partial<ILance> = {}) => lance({ tipo: 'falta', valor: null, tipo_falta: 'pessoal', ...patch });

describe('clocks', () => {
  const relogio = { periodo: 1, restanteMs: 600_000, posseMs: 24_000, rodando: true, referenciaMs: 1_000 };

  it('counts down only while running', () => {
    expect(clockAt(relogio, 11_000)).toEqual({ jogoMs: 590_000, posseMs: 14_000 });
    expect(clockAt({ ...relogio, rodando: false }, 11_000)).toEqual({ jogoMs: 600_000, posseMs: 24_000 });
    expect(clockAt(relogio, 100_000).posseMs).toBe(0);
  });

  it('freezes the values at a new reference', () => {
    expect(snapshotClock(relogio, 6_000)).toEqual({ ...relogio, restanteMs: 595_000, posseMs: 19_000, referenciaMs: 6_000 });
  });

  it('formats like a scoreboard', () => {
    expect(formatGameClock(600_000)).toBe('10:00');
    expect(formatGameClock(61_500)).toBe('01:02');
    expect(formatGameClock(59_960)).toBe('59.9');
    expect(formatShotClock(23_100)).toBe('24');
    expect(formatShotClock(4_260)).toBe('4.2');
  });
});

describe('summarizeLive', () => {
  it('sums the score by team and period, ignoring voided plays', () => {
    const r = summarizeLive(
      [
        lance({ valor: 3 }),
        lance({ time_id: 'B', jogador_id: 'b1', valor: 2, periodo: 2 }),
        lance({ valor: 2, anulado: true }),
      ],
      2,
      regras,
      times,
    );
    expect(r.placar).toEqual({ casa: 3, fora: 2 });
    expect(r.porPeriodo.slice(0, 2)).toEqual([
      { periodo: 1, casa: 3, fora: 0 },
      { periodo: 2, casa: 0, fora: 2 },
    ]);
    expect(r.jogadores.a1.pontos).toBe(3);
  });

  it('counts team fouls in the current period and flags the bonus', () => {
    const lances = [falta({ periodo: 1 }), ...Array.from({ length: 4 }, () => falta({ periodo: 2, jogador_id: 'a2' }))];
    const r = summarizeLive(lances, 2, regras, times);
    expect(r.faltasEquipe).toEqual({ casa: 4, fora: 0 });
    expect(r.emBonus.casa).toBe(true);
  });

  it('adds overtime fouls to the last period', () => {
    const r = summarizeLive([falta({ periodo: 4 }), falta({ periodo: 5, jogador_id: 'a2' })], 5, regras, times);
    expect(r.faltasEquipe.casa).toBe(2);
  });

  it('excludes with 5 fouls, 2 serious fouls or a disqualifying one', () => {
    const r = summarizeLive(
      [
        ...Array.from({ length: 5 }, () => falta()),
        falta({ jogador_id: 'a2', tipo_falta: 'tecnica' }),
        falta({ jogador_id: 'a2', tipo_falta: 'antidesportiva' }),
        falta({ jogador_id: 'a3', tipo_falta: 'desqualificante' }),
        falta({ jogador_id: 'a4' }),
      ],
      1,
      regras,
      times,
    );
    expect(r.jogadores.a1.excluido).toBe(true);
    expect(r.jogadores.a2.excluido).toBe(true);
    expect(r.jogadores.a3.excluido).toBe(true);
    expect(r.jogadores.a4.excluido).toBe(false);
  });

  it('counts timeouts per half and per overtime', () => {
    const tempo = (periodo: number) => lance({ tipo: 'tempo', jogador_id: null, valor: null, periodo });
    const lances = [tempo(1), tempo(2), tempo(3), tempo(5)];
    expect(summarizeLive(lances, 2, regras, times).temposUsados.casa).toBe(2);
    expect(summarizeLive(lances, 4, regras, times).temposUsados.casa).toBe(1);
    expect(summarizeLive(lances, 6, regras, times).temposUsados.casa).toBe(0);
    expect(timeoutLimit(2, regras)).toBe(2);
    expect(timeoutLimit(3, regras)).toBe(3);
    expect(timeoutLimit(5, regras)).toBe(1);
  });
});

describe('periods', () => {
  it('names periods and overtimes', () => {
    expect(periodLabel(2, regras)).toBe('2º período');
    expect(periodLabel(5, regras)).toBe('Prorrogação');
    expect(periodLabel(6, regras)).toBe('2ª prorrogação');
  });

  it('goes to overtime only on a disallowed tie', () => {
    expect(nextStep(3, regras, { casa: 10, fora: 10 }, false)).toBe('proximo_periodo');
    expect(nextStep(4, regras, { casa: 10, fora: 10 }, false)).toBe('prorrogacao');
    expect(nextStep(4, regras, { casa: 10, fora: 10 }, true)).toBe('fim');
    expect(nextStep(5, regras, { casa: 12, fora: 10 }, false)).toBe('fim');
  });
});

describe('unseenConfirmations', () => {
  it('keeps confirmed plays and voids until the server data shows them', () => {
    const feito = lance({ id: 'c1' });
    const anulado = lance({ id: 'c2' });
    const confirmados = [
      { tipo: 'lance' as const, lance: feito },
      { tipo: 'anular' as const, lanceId: 'c2' },
    ];
    // A consulta saiu antes: ainda não tem nem o lance nem a anulação.
    expect(unseenConfirmations([anulado], confirmados)).toEqual(confirmados);
    // A consulta seguinte trouxe os dois: nada mais a segurar na tela.
    expect(unseenConfirmations([feito, { ...anulado, anulado: true }], confirmados)).toEqual([]);
  });
});

describe('mergeLances', () => {
  it('appends pending plays and applies queued voids', () => {
    const servidor = [lance({ id: 's1' })];
    const merged = mergeLances(servidor, [lance({ id: 's1' }), lance({ id: 'p1' })], ['s1']);
    expect(merged.map((l) => [l.id, l.anulado, Boolean(l.pendente)])).toEqual([
      ['s1', true, false],
      ['p1', false, true],
    ]);
  });
});
