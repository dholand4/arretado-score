import type { ReactNode } from 'react';

export interface IEmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}
