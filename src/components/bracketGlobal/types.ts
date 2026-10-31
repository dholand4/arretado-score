import type { RoutePath } from '@/routes/types';
import type { IBracketLayout } from '@/utils/bracketLayout';

export interface IBracketProps {
  layout: IBracketLayout;
  champion?: string;
  // Destino de cada jogo na lista da série (súmula no painel, página do jogo na área pública).
  gameLink?: (gameId: string) => RoutePath;
}

export type BracketSide = 'left' | 'right' | 'center';
