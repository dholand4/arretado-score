export const TIME_ZONE = 'America/Fortaleza';

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dataHora.format(new Date(iso));
}

const diaMes = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit' });

// "25/10": data curta para listas em que o ano não importa.
export function formatDayMonth(iso: string | null | undefined): string {
  if (!iso) return '—';
  return diaMes.format(new Date(iso));
}
