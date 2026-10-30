import { BrandLink, Plus } from './style';
import type { IBrandProps } from './types';

export function BrandGlobal({ to, inverse = false }: IBrandProps) {
  return (
    <BrandLink to={to} $inverse={inverse} aria-label="Arretado Score — início">
      <span>
        Arretado <Plus>Score</Plus>
      </span>
    </BrandLink>
  );
}

export type { IBrandProps } from './types';
