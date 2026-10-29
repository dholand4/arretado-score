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
