import { StyledLink } from './style';
import type { ILinkButtonProps } from './types';

// Link com aparência de botão (navegação tipada por RoutePath).
export function LinkButtonGlobal({
  to,
  label,
  children,
  variant = 'outline',
  size = 'md',
  fullWidth = false,
  hideOnMobile = false,
}: ILinkButtonProps) {
  return (
    <StyledLink to={to} $variant={variant} $size={size} $fullWidth={fullWidth} $hideOnMobile={hideOnMobile}>
      {label ?? children}
    </StyledLink>
  );
}

export type { ILinkButtonProps } from './types';
