import { Badge } from './style';
import type { IBadgeProps } from './types';

export function BadgeGlobal({ label, tone = 'neutral' }: IBadgeProps) {
  return <Badge $tone={tone}>{label}</Badge>;
}

export type { BadgeTone, IBadgeProps } from './types';
