import { StyledLink } from './style';
import type { IInlineLinkProps } from './types';

export function InlineLinkGlobal({ to, children }: IInlineLinkProps) {
  return <StyledLink to={to}>{children}</StyledLink>;
}

export type { IInlineLinkProps } from './types';
