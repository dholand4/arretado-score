import type { IPublicCategory, IPublicPlayerGame } from '@/@types/public';
import type { RoutePath } from '@/routes/types';

export interface IPlayerGameLogProps {
  games: IPublicPlayerGame[];
  categories: IPublicCategory[];
  gameHref: (jogoId: string) => RoutePath;
}
