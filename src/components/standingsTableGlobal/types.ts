import type { IClassificacaoLinha } from '@/@types/game';

export interface IStandingsTableProps {
  rows: IClassificacaoLinha[];
  showDraws: boolean;
  qualifiedCount: number;
  extraQualified?: string[];
  caption?: string;
  // time_id → logo (escudo); sem logo, mostra as iniciais.
  logos?: Record<string, string | null>;
}
