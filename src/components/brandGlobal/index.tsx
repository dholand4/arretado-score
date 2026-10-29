import { Ball, BrandLink, Plus } from './style';
import type { IBrandProps } from './types';

export function BrandGlobal({ to, inverse = false }: IBrandProps) {
  return (
    <BrandLink to={to} $inverse={inverse} aria-label="TorneioMais — início">
      <Ball aria-hidden="true" />
      <span>
        Torneio<Plus>Mais</Plus>
      </span>
    </BrandLink>
  );
}

export type { IBrandProps } from './types';
