import type { IEvento, IJogoResumo, IMontagemEvento } from '@/@types/event';
import {
  assemblyNotice,
  defaultEventInput,
  gameNumbers,
  dependentGames,
  eventToInput,
  doubleGameMessage,
  doubledTeams,
  formatEventDate,
  formatTime,
  gameDetails,
  gameLabel,
  gameSides,
  shortTime,
  todayInFortaleza,
  validateEvent,
} from '@/utils/eventSchedule';

const montagem = (patch: Partial<IMontagemEvento>): IMontagemEvento => ({
  precisa_confirmar: false,
  max_sem_repeticao: 2,
  candidatos: 8,
  pedido: 3,
  jogo_duplo: false,
  jogos: [],
  evento_id: null,
  ...patch,
});

const jogo = (patch: Partial<IJogoResumo>) =>
  ({
    time_casa_id: 'a',
    time_fora_id: 'b',
    casa: { nome: 'Tubarões', sigla: 'TUB' },
    fora: { nome: 'Falcões', sigla: 'FAL' },
    fase: { nome: 'Fase 1' },
    grupo: null,
    serie: null,
    rodada: 2,
    numero_na_serie: null,
    ...patch,
  }) as IJogoResumo;

describe('event schedule', () => {
  it('formats dates and times in America/Fortaleza', () => {
    expect(todayInFortaleza(new Date('2026-11-08T02:00:00Z'))).toBe('2026-11-07');
    expect(formatEventDate('2026-11-07')).toMatch(/sáb\.?, 07\/11\/2026/);
    expect(formatTime('2026-11-07T22:00:00Z')).toBe('19:00');
    expect(formatTime(null)).toBe('—');
    expect(shortTime('19:30:00')).toBe('19:30');
  });

  it('describes games and finds doubled teams', () => {
    expect(gameLabel(jogo({}))).toBe('Tubarões x Falcões');
    expect(gameDetails(jogo({ grupo: { nome: 'A' } }))).toBe('Fase 1 · Grupo A');
    expect(gameDetails(jogo({ rodada: null, serie: { codigo: 'S1' }, numero_na_serie: 2 }))).toBe('Fase 1 · S1, jogo 2');
    expect([...doubledTeams([jogo({}), jogo({ time_casa_id: 'c' })])]).toEqual(['b']);
  });

  describe('games that depend on the previous result', () => {
    const time = (id: string) => ({ nome: id, sigla: null });
    const confronto = (id: string, casa: string, fora: string, patch: Partial<IJogoResumo> = {}) =>
      jogo({
        id,
        evento_id: 'dia1',
        ordem_no_evento: Number(id.slice(1)),
        time_casa_id: casa,
        time_fora_id: fora,
        casa: time(casa),
        fora: time(fora),
        status: 'agendado',
        ...patch,
      });

    it('shows loser and winner of the first game against the third team', () => {
      // Dia de 3 times como no app: Estadual x QuixaRocks, Okami x QuixaRocks, Estadual x Okami.
      const dia = [
        confronto('j1', 'Estadual', 'QuixaRocks'),
        confronto('j2', 'Okami BC', 'QuixaRocks'),
        confronto('j3', 'Estadual', 'Okami BC'),
      ];
      expect(Object.fromEntries(dependentGames(dia))).toEqual({
        j2: { home: 'Perdedor Jogo\u00a01', away: 'Okami BC' },
        j3: { home: 'Vencedor Jogo\u00a01', away: 'Okami BC' },
      });
      // A ordem vem de ordem_no_evento, não da posição na lista; outros dias não se misturam.
      const embaralhado = [dia[2], dia[0], confronto('j9', 'X', 'Y', { evento_id: 'dia2' }), dia[1]];
      expect([...dependentGames(embaralhado).keys()].sort()).toEqual(['j2', 'j3']);
      expect(gameSides(dia[0], dependentGames(dia))).toEqual({ home: 'Estadual', away: 'QuixaRocks' });
    });

    it('numbers the games across the competition, without restarting each day', () => {
      const jogos = [
        confronto('j1', 'A', 'B', { numero: 1 }),
        confronto('j2', 'B', 'C', { numero: 2 }),
        confronto('j4', 'X', 'Y', { evento_id: 'dia2', numero: 4 }),
        confronto('j9', 'X', 'Z', { evento_id: null, numero: null }),
      ];
      expect(Object.fromEntries(gameNumbers(jogos))).toEqual({ j1: 1, j2: 2, j4: 4 });
    });

    it('names the dependent games after the competition number', () => {
      const dia = [
        confronto('j1', 'A', 'B', { evento_id: 'dia2', numero: 4 }),
        confronto('j2', 'A', 'C', { evento_id: 'dia2', numero: 5 }),
        confronto('j3', 'B', 'C', { evento_id: 'dia2', numero: 6 }),
      ];
      expect(dependentGames(dia).get('j2')?.home).toBe('Perdedor Jogo\u00a04');
    });

    it('looks past a game that does not change the order', () => {
      // Dia de 4 jogos como no app: o Jogo 1 não mexe na ordem; o Jogo 2 decide quem enfrenta o UFC.
      const dia = [
        confronto('j1', 'QuixaRocks', 'UFC Quixadá'),
        confronto('j2', 'Estadual', 'Okami BC'),
        confronto('j3', 'UFC Quixadá', 'Okami BC'),
        confronto('j4', 'UFC Quixadá', 'Estadual'),
      ];
      expect(Object.fromEntries(dependentGames(dia))).toEqual({
        j3: { home: 'Perdedor Jogo\u00a02', away: 'UFC Quixadá' },
        j4: { home: 'Vencedor Jogo\u00a02', away: 'UFC Quixadá' },
      });
      // Com o Jogo 1 encerrado, continua igual; com o Jogo 2 encerrado, voltam os nomes.
      dia[0] = { ...dia[0], status: 'encerrado' };
      expect(dependentGames(dia).size).toBe(2);
      dia[1] = { ...dia[1], status: 'encerrado' };
      expect(dependentGames(dia).size).toBe(0);
    });

    it('stops once the order no longer depends on a result', () => {
      const dia = [
        confronto('j1', 'A', 'B', { status: 'encerrado', vencedor_id: 'A' }),
        confronto('j2', 'B', 'C'),
        confronto('j3', 'A', 'C'),
      ];
      expect(dependentGames(dia).size).toBe(0);
    });

    it('keeps the names when nobody repeats or the opponents differ', () => {
      expect(dependentGames([confronto('j1', 'A', 'B'), confronto('j2', 'C', 'D')]).size).toBe(0);
      expect(
        dependentGames([confronto('j1', 'A', 'B'), confronto('j2', 'A', 'C'), confronto('j3', 'B', 'D')]).size,
      ).toBe(0);
    });
  });

  it('turns a saved day into the edit form values', () => {
    const dia = { data: '2026-11-07', local: 'Ginásio', hora_inicio: '19:30:00', intervalo_min: 60, observacoes: null, jogos: [jogo({}), jogo({})] };
    expect(eventToInput(dia as unknown as IEvento)).toEqual({
      data: '2026-11-07',
      local: 'Ginásio',
      hora_inicio: '19:30',
      qtd_jogos: 2,
      intervalo_min: 60,
      observacoes: '',
      times: null,
    });
  });

  it('prefills and validates the event form', () => {
    const input = defaultEventInput('Ginásio', 90, '2026-11-07');
    expect(input).toMatchObject({ data: '2026-11-07', local: 'Ginásio', intervalo_min: 90, hora_inicio: '19:00' });
    expect(validateEvent(input)).toEqual({});
    const errors = validateEvent({ ...input, local: ' ', qtd_jogos: 0, data: '' });
    expect(Object.keys(errors).sort()).toEqual(['data', 'local', 'qtd_jogos']);
  });

  it('writes the double game warning of section 6.2', () => {
    expect(doubleGameMessage(montagem({}))).toBe(
      'Só é possível montar 2 jogos sem repetir time. Deseja permitir jogo duplo?',
    );
    expect(doubleGameMessage(montagem({ candidatos: 2, pedido: 5, max_sem_repeticao: 1 }))).toMatch(/Há só 2 jogos disponíveis/);
    expect(assemblyNotice(montagem({ jogos: ['1'], pedido: 3 }))).toMatch(/Havia só 1 jogo disponível/);
    expect(assemblyNotice(montagem({ jogos: ['1', '2', '3'], jogo_duplo: true }))).toMatch(/jogo duplo/);
    expect(assemblyNotice(montagem({ jogos: ['1', '2', '3'] }))).toBeNull();
  });
});
