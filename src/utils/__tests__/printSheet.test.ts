import { sheetDate, sheetPlayerRows, sheetPointRows, sheetTime } from '@/utils/printSheet';

describe('sheetPlayerRows', () => {
  it('keeps the number when there is one and leaves it blank otherwise', () => {
    const rows = sheetPlayerRows([
      { id: 'a', nome: 'Ana', numero: 4 },
      { id: 'b', nome: 'Bia', numero: null },
    ]);
    expect(rows.slice(0, 2)).toEqual([
      { key: 'a', nome: 'Ana', numero: '4' },
      { key: 'b', nome: 'Bia', numero: '' },
    ]);
  });

  it('fills up to 12 rows and grows past it for bigger rosters', () => {
    expect(sheetPlayerRows([])).toHaveLength(12);
    const grande = Array.from({ length: 15 }, (_, i) => ({ id: `j${i}`, nome: `J${i}`, numero: i }));
    expect(sheetPlayerRows(grande)).toHaveLength(15);
  });
});

describe('sheetPointRows', () => {
  it('numbers 1 to 120 in three blocks of 40', () => {
    const rows = sheetPointRows();
    expect(rows).toHaveLength(40);
    expect(rows[0]).toEqual([1, 41, 81]);
    expect(rows[39]).toEqual([40, 80, 120]);
  });
});

describe('sheet date and time', () => {
  it('prefers the game day date and formats the time in Fortaleza', () => {
    expect(sheetDate({ evento: { data: '2026-11-07', local: 'Ginásio' }, inicioPrevisto: null })).toBe('07/11/2026');
    expect(sheetDate({ evento: null, inicioPrevisto: '2026-11-07T22:00:00Z' })).toBe('07/11/2026');
    expect(sheetDate({ evento: null, inicioPrevisto: null })).toBe('');
    expect(sheetTime('2026-11-07T22:00:00Z')).toBe('19:00');
    expect(sheetTime(null)).toBe('');
  });
});
