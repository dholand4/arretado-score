import { LoaderGlobal } from '@/components/loaderGlobal';
import { StyledButton } from './style';
import type { IButtonProps } from './types';

export function ButtonGlobal({
  label,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  ...rest
}: IButtonProps) {
  return (
    <StyledButton
      type={type}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <LoaderGlobal size="sm" inline />}
      {label ?? children}
    </StyledButton>
  );
}

export type { IButtonProps } from './types';
