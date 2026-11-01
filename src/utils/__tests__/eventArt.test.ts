import type { IEvento, IJogoResumo } from '@/@types/event';
import { artDate, currentGameId, drawEventArt, eventArtContent, eventArtFileName, fitText } from '@/utils/eventArt';

const time = (id: string, logo: string | null = null) => ({ nome: `Time ${id}`, sigla: null, logo_url: logo });

const jogo = (id: string, casa: string, fora: string, ordem: number, patch: Partial<IJogoResumo> = {}): IJogoResumo =>
  ({
    id,
    evento_id: 'e1',
    ordem_no_evento: ordem,
    time_casa_id: casa,
    time_fora_id: fora,
    casa: time(casa, `https://logos/${casa}.webp`),
    fora: time(fora),
    fase: { nome: 'Fase 1' },
    grupo: null,
    serie: null,
    rodada: 2,
    numero_na_serie: null,
    status: 'agendado',
    placar_casa: null,
    placar_fora: null,
    inicio_previsto: `2026-11-01T${14 + ordem}:00:00Z`,
    ...patch,
  }) as IJogoResumo;

const event = (jogos: IJogoResumo[]): IEvento =>
  ({
    id: 'e1',
    competicao_id: 'c1',
    data: '2026-11-01',
    local: 'Ginásio Rinaldo',
    hora_inicio: '12:00:00',
    qtd_jogos: jogos.length,
    intervalo_min: 60,
    status: 'publicado',
    observacoes: 'Levar documento',
    jogos,
  }) as IEvento;

const league = { nome: 'Liga Quixadaense', logo_url: 'https://logos/liga.webp' };

// Contexto de canvas falso: mede o texto como 0,5 × tamanho da fonte por caractere e guarda o que foi escrito.
function fakeContext() {
  const texts: string[] = [];
  const state: Record<string | symbol, unknown> = { font: '10px sans-serif' };
  const fontSize = () => Number(/(\d+(\.\d+)?)px/.exec(String(state.font))?.[1] ?? 10);
  const gradient = { addColorStop: () => undefined };
  const ctx = new Proxy(state, {
    get(target, prop) {
      if (prop === 'fillText') return (text: string) => texts.push(text);
      if (prop === 'measureText') return (text: string) => ({ width: text.length * fontSize() * 0.5 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
      if (prop in target) return target[prop];
      return () => undefined;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, texts };
}

describe('artDate', () => {
  it('writes the day in full, with 1º on the first day of the month', () => {
    expect(artDate('2026-11-01')).toBe('Domingo, 1º de novembro');
    expect(artDate('2026-11-07')).toBe('Sábado, 7 de novembro');
  });
});

describe('eventArtContent', () => {
  it('lists the games in order with time, logos and day numbers', () => {
    const content = eventArtContent(event([jogo('j2', 'C', 'D', 2), jogo('j1', 'A', 'B', 1)]), league);
    expect(content).toMatchObject({
      leagueName: 'Liga Quixadaense',
      leagueLogo: 'https://logos/liga.webp',
      date: 'Domingo, 1º de novembro',
      place: 'A partir das 12:00 · Ginásio Rinaldo',
    });
    expect(content.games.map((g) => [g.order, g.home.name, g.away.name, g.center])).toEqual([
      ['JOGO 1', 'Time A', 'Time B', '12:00'],
      ['JOGO 2', 'Time C', 'Time D', '13:00'],
    ]);
    expect(content.games[0].home).toEqual({ name: 'Time A', logo: 'https://logos/A.webp', placeholder: false });
    expect(content.games[0].away).toEqual({ name: 'Time B', logo: null, placeholder: false });
    expect(content.games[0].details).toBe('Fase 1');
  });

  it('shows games that depend on the first result as in the app', () => {
    const content = eventArtContent(
      event([jogo('j1', 'A', 'B', 1), jogo('j2', 'C', 'A', 2), jogo('j3', 'C', 'B', 3)]),
      league,
    );
    const [, segundo, terceiro] = content.games;
    expect([segundo.home.name, segundo.away.name]).toEqual(['Perdedor Jogo 1', 'Time C']);
    expect([terceiro.home.name, terceiro.away.name]).toEqual(['Vencedor Jogo 1', 'Time C']);
    expect(segundo.home).toMatchObject({ logo: null, placeholder: true });
    expect(segundo.away).toMatchObject({ logo: 'https://logos/C.webp', placeholder: false });
    expect(segundo.details).toBe('Fase 1');
    // "Só os times": cada time uma vez, na ordem em que entra em quadra.
    expect(content.teams).toEqual([
      { name: 'Time A', logo: 'https://logos/A.webp', placeholder: false },
      { name: 'Time B', logo: null, placeholder: false },
      { name: 'Time C', logo: 'https://logos/C.webp', placeholder: false },
    ]);
  });

  it('shows the real teams once the first game has a result, in the list and in the spotlight', () => {
    // A venceu B: o dia já foi reordenado e o perdedor (B) joga o Jogo 2.
    const content = eventArtContent(
      event([
        jogo('j1', 'A', 'B', 1, { status: 'encerrado', placar_casa: 70, placar_fora: 65 }),
        jogo('j2', 'C', 'B', 2),
        jogo('j3', 'C', 'A', 3),
      ]),
      league,
    );
    expect(content.games.map((g) => `${g.home.name} x ${g.away.name}`)).toEqual([
      'Time A x Time B',
      'Time C x Time B',
      'Time C x Time A',
    ]);
    expect(content.games.some((g) => g.home.placeholder || g.away.placeholder)).toBe(false);

    const { ctx, texts } = fakeContext();
    drawEventArt(ctx, content, new Map(), 'post', 'game');
    expect(texts).toEqual(expect.arrayContaining(['AGORA EM QUADRA', 'JOGO 2', 'Time C', 'Time B']));
    expect(texts.some((t) => /Perdedor|Vencedor/.test(t))).toBe(false);
  });

  it('shows the score or the status of games that already have a result', () => {
    const content = eventArtContent(
      event([
        jogo('j1', 'A', 'B', 1, { status: 'encerrado', placar_casa: 70, placar_fora: 65 }),
        jogo('j2', 'C', 'D', 2, { status: 'wo' }),
        jogo('j3', 'E', 'F', 3, { status: 'cancelado' }),
      ]),
      league,
    );
    expect(content.games.map((g) => g.center)).toEqual(['70 x 65', 'W.O.', 'Cancelado']);
  });

  it('has no game number on a day with a single game', () => {
    expect(eventArtContent(event([jogo('j1', 'A', 'B', 1)]), league).games[0].order).toBeNull();
  });
});

describe('eventArtFileName', () => {
  it('names the file by day and format', () => {
    expect(eventArtFileName({ data: '2026-11-01' }, 'story', 'games')).toBe('jogos-2026-11-01-story.png');
    expect(eventArtFileName({ data: '2026-11-01' }, 'post', 'teams')).toBe('times-2026-11-01-post.png');
    expect(eventArtFileName({ data: '2026-11-01' }, 'post', 'game', { order: 'JOGO 2' })).toBe(
      'confronto-2026-11-01-jogo-2-post.png',
    );
  });
});

describe('fitText', () => {
  it('keeps the largest size that fits in one line', () => {
    const { ctx } = fakeContext();
    expect(fitText(ctx, 'Okami BC', 400, { max: 40, min: 20 })).toEqual({ size: 40, lines: ['Okami BC'] });
  });

  it('wraps long names in up to the allowed lines before shrinking more', () => {
    const { ctx } = fakeContext();
    const fitted = fitText(ctx, 'Associação Atlética Banco do Brasil', 300, { max: 40, min: 20, maxLines: 2 });
    expect(fitted.lines).toHaveLength(2);
    expect(fitted.lines.join(' ')).toBe('Associação Atlética Banco do Brasil');
    fitted.lines.forEach((line) => expect(line.length * fitted.size * 0.5).toBeLessThanOrEqual(300));
  });

  it('breaks on the given separator', () => {
    const { ctx } = fakeContext();
    const fitted = fitText(ctx, 'Fase de Grupos · Grupo A', 200, { max: 22, min: 20, maxLines: 2, separator: ' · ' });
    expect(fitted.lines).toEqual(['Fase de Grupos', 'Grupo A']);
  });

  it('cuts with an ellipsis when not even the minimum size fits', () => {
    const { ctx } = fakeContext();
    const fitted = fitText(ctx, 'Sport Club Quixeramobim do Sertão Central', 150, { max: 30, min: 20 });
    expect(fitted.size).toBe(20);
    expect(fitted.lines[0].endsWith('…')).toBe(true);
    expect(fitted.lines[0].length * 20 * 0.5).toBeLessThanOrEqual(150);
  });
});

describe('drawEventArt', () => {
  const content = eventArtContent(
    event([jogo('j1', 'A', 'B', 1), jogo('j2', 'C', 'A', 2), jogo('j3', 'C', 'B', 3)]),
    league,
  );

  it.each(['post', 'story'] as const)('writes the day, the place and every game (%s)', (format) => {
    const { ctx, texts } = fakeContext();
    drawEventArt(ctx, content, new Map(), format);
    expect(texts).toEqual(
      expect.arrayContaining([
        'Liga Quixadaense',
        'JOGOS DO DIA',
        'Domingo, 1º de novembro',
        'A partir das 12:00 · Ginásio Rinaldo',
        'JOGO 1',
        'Time A',
        'Perdedor Jogo 1',
        'Vencedor Jogo 1',
        '12:00',
        '14:00',
        'Score',
      ]),
    );
    // Observações do dia não entram na arte.
    expect(texts).not.toContain('Levar documento');
  });

  it('picks the first game without a result as the one happening now', () => {
    expect(currentGameId(content)).toBe('j1');
    expect(currentGameId({ games: content.games.map((g, i) => ({ ...g, finished: i < 2 })) })).toBe('j3');
    expect(currentGameId({ games: content.games.map((g) => ({ ...g, finished: true })) })).toBe('j3');
  });

  it('draws a single matchup in the spotlight layout, keeping the loser/winner labels', () => {
    const { ctx, texts } = fakeContext();
    drawEventArt(ctx, content, new Map(), 'post', 'game', 'j2');
    expect(texts).toEqual(expect.arrayContaining(['AGORA EM QUADRA', 'JOGO 2', 'Time C', 'VS']));
    expect(texts.some((t) => /^Perdedor\sJogo\s1$/.test(t))).toBe(true);
    expect(texts.some((t) => /^Vencedor/.test(t))).toBe(false);
    expect(texts).not.toContain('JOGOS DO DIA');
  });

  it('shows the final score of a finished matchup', () => {
    const { ctx, texts } = fakeContext();
    const encerrado = {
      ...content,
      games: content.games.map((g) => (g.id === 'j1' ? { ...g, finished: true, center: '50 x 40' } : g)),
    };
    drawEventArt(ctx, encerrado, new Map(), 'story', 'game', 'j1');
    expect(texts).toEqual(expect.arrayContaining(['RESULTADO', '50 x 40']));
    expect(texts.some((t) => t.startsWith('Final'))).toBe(true);
  });

  it('lists only the teams, without the matchups or times, in the teams layout', () => {
    const { ctx, texts } = fakeContext();
    drawEventArt(ctx, content, new Map(), 'post', 'teams');
    expect(texts).toEqual(expect.arrayContaining(['JOGOS DO DIA', 'Domingo, 1º de novembro', 'Time A', 'Time B', 'Time C']));
    expect(texts.filter((t) => t.startsWith('Time '))).toEqual(['Time A', 'Time B', 'Time C']);
    expect(texts).not.toContain('Perdedor Jogo\u00a01');
    expect(texts).not.toContain('12:00');
    expect(texts).not.toContain('JOGO 1');
  });

  it('uses two columns when many teams play', () => {
    const teams = Array.from({ length: 8 }, (_, i) => ({ name: `Equipe ${i}`, logo: null, placeholder: false }));
    const { ctx, texts } = fakeContext();
    drawEventArt(ctx, { ...content, teams }, new Map(), 'story', 'teams');
    expect(texts.filter((t) => t.startsWith('Equipe '))).toHaveLength(8);
  });

  it('switches to one-line cards when there are many games', () => {
    const many = { ...content, games: Array.from({ length: 8 }, (_, i) => ({ ...content.games[0], id: `g${i}` })) };
    const { ctx, texts } = fakeContext();
    drawEventArt(ctx, many, new Map(), 'post');
    expect(texts.filter((t) => t === 'Time A')).toHaveLength(8);
  });
});
