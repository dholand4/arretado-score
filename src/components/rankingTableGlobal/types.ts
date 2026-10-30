import type { IRankingRow } from '@/@types/public';

export interface IRankingTableProps {
  rows: IRankingRow[];
  caption?: string;
  limit?: number;
  // Filtra por jogador ou time sem mudar a posição real no ranking.
  query?: string;
}
