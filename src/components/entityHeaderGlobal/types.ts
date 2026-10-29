import type { ReactNode } from 'react';

export interface IEntityHeaderProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  badges?: ReactNode;
  actions?: ReactNode;
}
