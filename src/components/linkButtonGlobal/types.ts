import type { ReactNode } from 'react';
import type { ButtonSize, ButtonVariant } from '@/components/buttonGlobal/types';
import type { RoutePath } from '@/routes/types';

export interface ILinkButtonProps {
  to: RoutePath;
  label?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  // No celular o "voltar" fica no topo (BackLinkGlobal); este some.
  hideOnMobile?: boolean;
}
