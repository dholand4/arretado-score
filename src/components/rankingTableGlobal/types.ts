import type { IRankingRow } from '@/@types/public';
import type { RoutePath } from '@/routes/types';

export interface IRankingTableProps {
  rows: IRankingRow[];
  caption?: string;
  limit?: number;
  // Filtra por jogador ou time sem mudar a posição real no ranking.
  query?: string;
  // Página do jogador (seção 6.7.1); sem isto o nome é só texto.
  playerHref?: (jogadorId: string) => RoutePath;
}
