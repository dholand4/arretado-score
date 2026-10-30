import type { ILinhaMataMata } from '@/@types/game';

export interface IKnockoutTableProps {
  rows: ILinhaMataMata[];
  // Ainda há série em andamento: a repescagem é provisória.
  provisional: boolean;
  caption?: string;
}
