import { useScrollEdges } from '@/hooks/useScrollEdges';
import { Item, List, Nav } from './style';
import type { ISubNavProps } from './types';

export function SubNavGlobal({ items, ariaLabel }: ISubNavProps) {
  const { ref, edges } = useScrollEdges<HTMLElement>();
  return (
    <Nav ref={ref} aria-label={ariaLabel} $fadeStart={edges.start} $fadeEnd={edges.end}>
      <List>
        {items.map((item) => (
          <li key={item.to}>
            <Item to={item.to} end={item.end}>
              {item.label}
            </Item>
          </li>
        ))}
      </List>
    </Nav>
  );
}

export type { ISubNavItem, ISubNavProps } from './types';
