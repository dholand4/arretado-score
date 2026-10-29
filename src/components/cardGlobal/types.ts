import type { ReactNode } from 'react';

export interface ICardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  as?: 'section' | 'article' | 'div' | 'li';
}
