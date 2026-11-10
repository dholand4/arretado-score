import type { ReactNode } from 'react';

export interface IEntityHeaderProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  // Quadrado para escudos (padrão); redondo para fotos de pessoas.
  imageShape?: 'square' | 'circle';
  badges?: ReactNode;
  actions?: ReactNode;
}
