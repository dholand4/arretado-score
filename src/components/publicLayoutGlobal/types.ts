import type { ReactNode } from 'react';
import type { RoutePath } from '@/routes/types';

export interface IPublicLayoutProps {
  children: ReactNode;
  accountLink: { to: RoutePath; label: string };
}
