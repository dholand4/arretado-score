import type { IJogoLista } from '@/@types/game';
import type { IRankingRow } from '@/@types/public';
import { TIME_ZONE } from './date';
import { hasResult } from './games';

const diaFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

// Jogos de dias publicados agrupados por dia (America/Fortaleza); sem data por último.
export function groupGamesByDay(jogos: IJogoLista[]): { dia: string; jogos: IJogoLista[] }[] {
  const grupos = new Map<string, IJogoLista[]>();
  for (const jogo of jogos) {
    const dia = jogo.inicio_previsto ? diaFormat.format(new Date(jogo.inicio_previsto)) : 'Sem data definida';
    grupos.set(dia, [...(grupos.get(dia) ?? []), jogo]);
  }
  return [...grupos.entries()].map(([dia, lista]) => ({ dia: dia.charAt(0).toUpperCase() + dia.slice(1), jogos: lista }));
}

export function upcomingGames(jogos: IJogoLista[], agora = new Date(), limite = 6): IJogoLista[] {
  return jogos
    .filter((j) => j.status === 'agendado' && j.inicio_previsto && new Date(j.inicio_previsto) >= agora)
    .slice(0, limite);
}

export function latestResults(jogos: IJogoLista[], limite = 6): IJogoLista[] {
  return jogos
    .filter(hasResult)
    .sort((a, b) => (b.inicio_previsto ?? b.created_at).localeCompare(a.inicio_previsto ?? a.created_at))
    .slice(0, limite);
}

export type RankingOrder = 'total' | 'media';

// Ordena por total (padrão) ou por média com mínimo de jogos (seção 6.7).
export function sortRanking(linhas: IRankingRow[], ordem: RankingOrder, minimoJogos = 1): IRankingRow[] {
  const elegiveis = ordem === 'media' ? linhas.filter((l) => l.jogos >= minimoJogos) : linhas;
  return [...elegiveis].sort((a, b) =>
    ordem === 'media'
      ? b.media - a.media || b.total - a.total
      : b.total - a.total || b.media - a.media || (a.jogador?.nome ?? '').localeCompare(b.jogador?.nome ?? ''),
  );
}
