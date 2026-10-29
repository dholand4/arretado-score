import type { ReactNode } from 'react';

export interface IAuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}
