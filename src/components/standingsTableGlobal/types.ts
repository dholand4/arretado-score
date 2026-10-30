import type { IClassificacaoLinha } from '@/@types/game';

export interface IStandingsTableProps {
  rows: IClassificacaoLinha[];
  showDraws: boolean;
  qualifiedCount: number;
  extraQualified?: string[];
  caption?: string;
}
