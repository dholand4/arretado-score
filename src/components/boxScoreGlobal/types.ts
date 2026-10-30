import type { IPublicCategory, IPublicPlayer } from '@/@types/public';

export interface IBoxScoreProps {
  teamName: string;
  score: number | null;
  players: IPublicPlayer[];
  categories: IPublicCategory[];
  stats: Record<string, Record<string, number>>;
}
