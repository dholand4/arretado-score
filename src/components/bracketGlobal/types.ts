import type { IBracketLayout } from '@/utils/bracketLayout';

export interface IBracketProps {
  layout: IBracketLayout;
  champion?: string;
}

export type BracketSide = 'left' | 'right' | 'center';
