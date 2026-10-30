import type { ISumulaImpressa } from '@/@types/game';
import { TIME_ZONE } from './date';

// Linhas mínimas de jogadores por equipe, como na súmula em papel.
export const SHEET_MIN_PLAYER_ROWS = 12;
// Contagem de pontos: 3 blocos de 40 (1–120).
export const SHEET_POINT_ROWS = 40;
export const SHEET_POINT_BLOCKS = 3;

export interface ISheetPlayerRow {
  key: string;
  nome: string;
  // Sem número cadastrado, a casa fica em branco para preencher à mão.
  numero: string;
}

export function sheetPlayerRows(
  jogadores: ISumulaImpressa['casaJogadores'],
  minRows = SHEET_MIN_PLAYER_ROWS,
): ISheetPlayerRow[] {
  const linhas: ISheetPlayerRow[] = jogadores.map((jogador) => ({
    key: jogador.id,
    nome: jogador.nome,
    numero: jogador.numero === null ? '' : String(jogador.numero),
  }));
  for (let i = linhas.length; i < minRows; i += 1) linhas.push({ key: `vazia-${i}`, nome: '', numero: '' });
  return linhas;
}

// Linha i da contagem: números de cada bloco (1, 41, 81 · 2, 42, 82 …).
export function sheetPointRows(): number[][] {
  return Array.from({ length: SHEET_POINT_ROWS }, (_, linha) =>
    Array.from({ length: SHEET_POINT_BLOCKS }, (_, bloco) => bloco * SHEET_POINT_ROWS + linha + 1),
  );
}

const dataCurta = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, dateStyle: 'short' });
const horaCurta = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });

// Data do dia de jogos (AAAA-MM-DD) ou, sem dia, a do horário previsto.
export function sheetDate(sheet: Pick<ISumulaImpressa, 'evento' | 'inicioPrevisto'>): string {
  if (sheet.evento?.data) {
    const [ano, mes, dia] = sheet.evento.data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return sheet.inicioPrevisto ? dataCurta.format(new Date(sheet.inicioPrevisto)) : '';
}

export function sheetTime(inicioPrevisto: string | null): string {
  return inicioPrevisto ? horaCurta.format(new Date(inicioPrevisto)) : '';
}
