import type { ISumulaImpressa } from '@/@types/game';
import type { ISheetPlayerRow } from '@/utils/printSheet';

export interface IScoreSheetPrintProps {
  sheet: ISumulaImpressa;
}

export interface ITeamBlockProps {
  letter: 'A' | 'B';
  name: string;
  rows: ISheetPlayerRow[];
}
