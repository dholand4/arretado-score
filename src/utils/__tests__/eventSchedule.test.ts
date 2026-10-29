import type { IJogoResumo, IMontagemEvento } from '@/@types/event';
import {
  assemblyNotice,
  defaultEventInput,
  doubleGameMessage,
  doubledTeams,
  formatEventDate,
  formatTime,
  gameDetails,
  gameLabel,
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
    expect(gameDetails(jogo({ grupo: { nome: 'A' } }))).toBe('Fase 1 · Grupo A · Rodada 2');
    expect(gameDetails(jogo({ rodada: null, serie: { codigo: 'S1' }, numero_na_serie: 2 }))).toBe('Fase 1 · S1, jogo 2');
    expect([...doubledTeams([jogo({}), jogo({ time_casa_id: 'c' })])]).toEqual(['b']);
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
