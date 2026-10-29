import type { ReactNode } from 'react';
import type { RoutePath } from '@/routes/types';

export interface IPanelNavItem {
  to: RoutePath;
  label: string;
  end?: boolean;
}

export interface IPanelLayoutProps {
  children: ReactNode;
  userName: string;
  roleLabel: string;
  navItems: IPanelNavItem[];
  onSignOut: () => void;
  signingOut?: boolean;
}
