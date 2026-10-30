import type { Json } from '@/@types/database';

export function bracketOrigin(origin: Json | null): string {
  if (!origin || Array.isArray(origin) || typeof origin !== 'object') return 'A definir';
  const type = origin.tipo;
  const position = origin.posicao;
  if (type === 'posicao') return `${position}º colocado da Fase ${origin.fase_ordem}`;
  if (type === 'posicao_grupo') return `${position}º do Grupo ${origin.grupo} da Fase ${origin.fase_ordem}`;
  if (type === 'melhor_extra') return `${position}º melhor extra da Fase ${origin.fase_ordem}`;
  if (type === 'melhor_perdedor') {
    return `${position === 1 ? 'Melhor' : `${position}º melhor`} perdedor da Fase ${origin.fase_ordem}`;
  }
  if (type === 'vencedor') return `Vencedor ${origin.serie}`;
  if (type === 'perdedor') return `Perdedor ${origin.serie}`;
  return 'A definir';
}
