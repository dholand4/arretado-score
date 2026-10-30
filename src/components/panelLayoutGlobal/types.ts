import type { ReactNode } from 'react';
import type { RoutePath } from '@/routes/types';

export interface IPanelNavItem {
  to: RoutePath;
  label: string;
  end?: boolean;
}

// Grupo do menu lateral; `title` aparece acima dos itens (ex.: nome da competição).
export interface IPanelNavSection {
  key: string;
  title?: string;
  // Link discreto acima do título (ex.: voltar para a lista de competições).
  back?: IPanelNavItem;
  items: IPanelNavItem[];
}

export interface IPanelLayoutProps {
  children: ReactNode;
  userName: string;
  roleLabel: string;
  sections: IPanelNavSection[];
  onSignOut: () => void;
  signingOut?: boolean;
}
