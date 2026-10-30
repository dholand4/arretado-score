import type { RoutePath } from '@/routes/types';

export interface ITeamLinkCardProps {
  to: RoutePath;
  name: string;
  logoUrl?: string | null;
  sigla?: string | null;
  meta?: string;
}
