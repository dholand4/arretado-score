import type { ReactNode } from 'react';

export interface IPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}
