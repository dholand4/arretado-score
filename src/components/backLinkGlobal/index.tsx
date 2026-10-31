import { Chevron, StyledBackLink } from './style';
import type { IBackLinkProps } from './types';

export function BackLinkGlobal({ to, label }: IBackLinkProps) {
  return (
    <StyledBackLink to={to}>
      <Chevron aria-hidden>‹</Chevron>
      {label}
    </StyledBackLink>
  );
}

export type { IBackLinkProps } from './types';
