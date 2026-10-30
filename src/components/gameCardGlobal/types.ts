import type { BadgeTone } from '@/components/badgeGlobal';
import type { RoutePath } from '@/routes/types';

export interface IGameCardProps {
  to: RoutePath;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  statusLabel: string;
  statusTone: BadgeTone;
  description: string;
  actionLabel: string;
}
