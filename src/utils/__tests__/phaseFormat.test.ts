import type { IFase, IFaseForm } from '@/@types/phase';
import {
  analyzeFormat,
  buildFormatSummary,
  groupSizes,
  groupsConfigIssue,
  newPhase,
  originShort,
  phaseFromDb,
  roundRobinGames,
  summaryText,
  toPayload,
} from '@/utils/phaseFormat';

const league = (patch: Partial<IFaseForm> = {}): IFaseForm => ({ ...newPhase(0), nome: 'Fase 1', ...patch });
const ko = (patch: Partial<IFaseForm> = {}): IFaseForm => ({ ...newPhase(1), ...patch });

const canonical = () => [
  league({ classificam: 4 }),
  ko({ nome: 'Semifinal', melhor_de: 3, cruzamento: 'por_campanha' }),
  ko({ nome: 'Final', melhor_de: 3, cruzamento: 'vencedores' }),
];

describe('phase format', () => {
  it('suggests sensible defaults for new phases', () => {
    expect(newPhase(0)).toMatchObject({ tipo: 'todos_contra_todos', cruzamento: null });
    expect(newPhase(1, 'todos_contra_todos')).toMatchObject({ tipo: 'mata_mata', cruzamento: 'por_campanha' });
    expect(newPhase(2, 'mata_mata')).toMatchObject({ cruzamento: 'vencedores' });
  });

  it('counts round-robin games and balanced groups', () => {
    expect(roundRobinGames(5, 1)).toBe(10);
    expect(roundRobinGames(5, 2)).toBe(20);
    expect(groupSizes(7, 2)).toEqual([4, 3]);
    expect(groupsConfigIssue(3, 2, 1, 0)).toMatch(/cabem no máximo 1 grupos/);
    expect(groupsConfigIssue(7, 2, 3, 1)).toBeNull();
    expect(groupsConfigIssue(6, 2, 3, 1)).toMatch(/Só 0 grupo/);
  });

  it('builds the summary of the spec example', () => {
    const phases = canonical();
    const analysis = analyzeFormat(phases, 5);
    expect(analysis.errors).toEqual([]);
    expect(summaryText(buildFormatSummary(phases, analysis))).toBe(
      'Fase 1: 5 times, todos contra todos, 10 jogos → 4 avançam → Semifinal melhor de 3: 1º x 4º, 2º x 3º → Final melhor de 3',
    );
    expect(analysis.phases[2].series.map((s) => `${originShort(s.origem_a)} x ${originShort(s.origem_b)}`)).toEqual([
      'Venc. S1 x Venc. S2',
    ]);
  });

  it('validates the knockout needs an even number of teams', () => {
    const phases = canonical();
    phases[0].classificam = 3;
    const { errors } = analyzeFormat(phases, 5);
    expect(errors).toContainEqual({ phaseIndex: 1, field: 'tipo', message: 'O mata-mata precisa de número par de times (chegam 3).' });
  });

  it('uses the team count only as a warning on the first phase', () => {
    const { errors, warnings } = analyzeFormat(canonical(), 3);
    expect(errors).toEqual([]);
    expect(warnings[0].message).toBe('Avançam 4 times, mas só 3 disputam a fase.');
    expect(analyzeFormat(canonical(), 0).warnings[0].message).toMatch(/Cadastre ao menos 2 times/);
  });

  it('crosses groups and adds the third place match', () => {
    const phases = [
      league({ nome: 'Grupos', tipo: 'grupos', qtd_grupos: 2, classificam: 2 }),
      ko({ nome: 'Semifinal', cruzamento: 'cruzado_grupos' }),
      ko({ nome: 'Final', cruzamento: 'vencedores', disputa_terceiro: true }),
    ];
    const analysis = analyzeFormat(phases, 8);
    expect(analysis.errors).toEqual([]);
    const codes = analysis.phases.flatMap((p) =>
      p.series.map((s) => `${s.codigo}=${originShort(s.origem_a)} x ${originShort(s.origem_b)}`),
    );
    expect(codes).toEqual(['S1=1ºA x 2ºB', 'S2=1ºB x 2ºA', 'S3=Venc. S1 x Venc. S2', 'S4=Perd. S1 x Perd. S2']);
    expect(summaryText(buildFormatSummary(phases, analysis))).toBe(
      'Grupos: 8 times, 2 grupos, 12 jogos → 4 avançam (2 por grupo) → Semifinal jogo único: 1ºA x 2ºB, 1ºB x 2ºA → Final jogo único + disputa de 3º lugar',
    );
  });

  it('rejects incompatible crossings and third place outside the final', () => {
    const errs = (phases: IFaseForm[]) => analyzeFormat(phases, 8).errors.map((e) => e.message);
    expect(errs([league({ classificam: 4 }), ko({ cruzamento: 'cruzado_grupos' })])[0]).toMatch(/cruzamento entre grupos/);
    expect(errs([league({ classificam: 4 }), ko({ cruzamento: 'vencedores' })])[0]).toMatch(/por vencedores/);
    expect(errs([league({ classificam: 4 }), ko({ cruzamento: 'por_campanha', disputa_terceiro: true })])[0]).toMatch(/3º lugar/);
    expect(errs([league({ classificam: 4 }), ko({ cruzamento: 'por_campanha' }), ko({ cruzamento: 'vencedores' }), league()])[0]).toMatch(
      /Chegam só 1 time/,
    );
    expect(errs([ko({ cruzamento: 'por_campanha' })])[0]).toMatch(/primeira fase/);
  });

  it('validates manual matchups against the available origins', () => {
    const base = [league({ classificam: 4 }), ko({ cruzamento: 'manual' })];
    const analysis = analyzeFormat(base, 6);
    expect(analysis.phases[1].origens.map((o) => o.label)).toEqual([
      '1º colocado da Fase 1',
      '2º colocado da Fase 1',
      '3º colocado da Fase 1',
      '4º colocado da Fase 1',
    ]);
    expect(analysis.errors[0].message).toBe('Defina os 2 confrontos com origens válidas.');
    const [o1, o2, o3, o4] = analysis.phases[1].origens.map((o) => o.origem);
    base[1].confrontos = [
      { origem_a: o1, origem_b: o2 },
      { origem_a: o1, origem_b: o4 },
    ];
    expect(analyzeFormat(base, 6).errors[0].message).toBe('Cada origem só pode aparecer em um confronto.');
    base[1].confrontos[1] = { origem_a: o3, origem_b: o4 };
    expect(analyzeFormat(base, 6).errors).toEqual([]);
    expect(toPayload(base)[1].confrontos).toHaveLength(2);
  });

  describe('best losers (repescagem)', () => {
    // 6 times → quartas 1x6, 2x5, 3x4 → 3 vencedores + 1 melhor perdedor → semifinal → final.
    const six = () => [
      league({ classificam: 6 }),
      ko({ nome: 'Quartas', melhor_de: 3, cruzamento: 'por_campanha', melhores_extras: 1 }),
      ko({ nome: 'Semifinal', melhor_de: 3, cruzamento: 'por_campanha' }),
      ko({ nome: 'Final', melhor_de: 3, cruzamento: 'vencedores' }),
    ];

    it('completes the next phase with the best loser', () => {
      const phases = six();
      const analysis = analyzeFormat(phases, 6);
      expect(analysis.errors).toEqual([]);
      expect(analysis.phases[1].classificados).toBe(4);
      expect(analysis.phases[2].entram).toBe(4);
      expect(analysis.phases[2].series.map((s) => `${originShort(s.origem_a)} x ${originShort(s.origem_b)}`)).toEqual([
        '1º x 4º',
        '2º x 3º',
      ]);
      expect(summaryText(buildFormatSummary(phases, analysis))).toBe(
        'Fase 1: 6 times, todos contra todos, 15 jogos → 6 avançam → Quartas melhor de 3: 1º x 6º, 2º x 5º, 3º x 4º → ' +
          '4 avançam (3 vencedores + 1 melhor perdedor) → Semifinal melhor de 3: 1º x 4º, 2º x 3º → Final melhor de 3',
      );
      expect(toPayload(phases).map((p) => p.melhores_extras)).toEqual([0, 1, 0, 0]);
    });

    it('explains the odd count and blocks invalid uses', () => {
      const semExtra = six();
      semExtra[1].melhores_extras = 0;
      expect(analyzeFormat(semExtra, 6).errors[0].message).toBe(
        'O mata-mata precisa de número par de times (chegam 3). Na fase anterior, use "Melhores perdedores" para completar.',
      );

      const vencedores = six();
      vencedores[2].cruzamento = 'vencedores';
      expect(analyzeFormat(vencedores, 6).errors[0].message).toBe(
        'A fase anterior leva melhores perdedores; use o cruzamento por campanha ou o manual.',
      );

      const demais = six();
      demais[1].melhores_extras = 3;
      expect(analyzeFormat(demais, 6).errors[0].message).toBe('Os melhores perdedores precisam ser menos que os confrontos (3).');

      const ultima = [league({ classificam: 4 }), ko({ cruzamento: 'por_campanha', melhores_extras: 1 })];
      expect(analyzeFormat(ultima, 6).errors[0].message).toBe('A última fase define o campeão; ela não leva melhores perdedores.');

      const perdedores = six();
      perdedores.splice(2, 0, ko({ nome: '5º lugar', cruzamento: 'outra_fase', fase_origem: 2, resultado_origem: 'perdedores' }));
      expect(analyzeFormat(perdedores, 6).errors[0].message).toBe(
        'A fase escolhida leva melhores perdedores adiante; os perdedores dela não podem formar outra fase.',
      );
    });

    it('offers the best loser as a manual origin', () => {
      const phases = six();
      phases[2].cruzamento = 'manual';
      const analysis = analyzeFormat(phases, 6);
      expect(analysis.phases[2].origens.map((o) => o.label)).toEqual([
        'Vencedor da S1',
        'Vencedor da S2',
        'Vencedor da S3',
        'Melhor perdedor da Quartas',
      ]);
      const [s1, s2, s3, perdedor] = analysis.phases[2].origens.map((o) => o.origem);
      phases[2].confrontos = [
        { origem_a: s1, origem_b: perdedor },
        { origem_a: s2, origem_b: s3 },
      ];
      expect(analyzeFormat(phases, 6).errors).toEqual([]);
      expect(originShort(perdedor)).toBe('Melhor perd.');
    });
  });

  it('builds the payload and reads phases from the database', () => {
    const payload = toPayload([league({ classificam: 4, qtd_grupos: 3 }), ko({ cruzamento: 'por_campanha', turnos: 2 })]);
    expect(payload[0]).toMatchObject({ qtd_grupos: null, classificam: 4, melhor_de: 1, cruzamento: null });
    expect(payload[1]).toMatchObject({ turnos: 1, classificam: null, cruzamento: 'por_campanha' });

    const db = {
      nome: 'Semi',
      tipo: 'mata_mata',
      turnos: 1,
      qtd_grupos: null,
      sorteio_grupos: 'aleatorio',
      classificam: 2,
      melhores_extras: 0,
      melhor_de: 3,
      cruzamento: 'manual',
      disputa_terceiro: false,
      status: 'em_andamento',
      series: [
        { codigo: 'S2', origem_a: { tipo: 'posicao', fase_ordem: 1, posicao: 2 }, origem_b: { tipo: 'posicao', fase_ordem: 1, posicao: 3 } },
        { codigo: 'S1', origem_a: { tipo: 'posicao', fase_ordem: 1, posicao: 1 }, origem_b: { tipo: 'posicao', fase_ordem: 1, posicao: 4 } },
      ],
      grupos: [],
    } as unknown as IFase;
    const form = phaseFromDb(db);
    expect(form).toMatchObject({ melhor_de: 3, iniciada: true, qtd_grupos: 2 });
    expect(form.confrontos[0].origem_b).toEqual({ tipo: 'posicao', fase_ordem: 1, posicao: 4 });
  });
});
