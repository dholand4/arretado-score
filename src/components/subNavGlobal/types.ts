import type { RoutePath } from '@/routes/types';

export interface ISubNavItem {
  to: RoutePath;
  label: string;
  end?: boolean;
}

export interface ISubNavProps {
  items: ISubNavItem[];
  ariaLabel: string;
}
