import type { IPublicCategory, IPublicPlayer } from '@/@types/public';
import type { RoutePath } from '@/routes/types';

export interface IBoxScoreProps {
  teamName: string;
  score: number | null;
  players: IPublicPlayer[];
  categories: IPublicCategory[];
  stats: Record<string, Record<string, number>>;
  // Página do jogador (seção 6.7.1); sem isto o nome é só texto.
  playerHref?: (jogadorId: string) => RoutePath;
}
