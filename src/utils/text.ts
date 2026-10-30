export function initials(name: string): string {
  // Ignora palavras sem letras (ex.: o ano em "Liga 2026").
  const parts = name.trim().split(/\s+/).filter((part) => /\p{L}/u.test(part));
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// Busca sem diferenciar maiúsculas nem acentos ("joao" encontra "João").
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function matchesSearch(query: string, ...texts: (string | null | undefined)[]): boolean {
  const termo = normalize(query);
  if (!termo) return true;
  return texts.some((text) => text && normalize(text).includes(termo));
}
