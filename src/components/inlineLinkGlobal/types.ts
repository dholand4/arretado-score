import type { ReactNode } from 'react';
import type { RoutePath } from '@/routes/types';

export interface IInlineLinkProps {
  to: RoutePath;
  children: ReactNode;
}
