import { Item, List, Nav } from './style';
import type { ISubNavProps } from './types';

export function SubNavGlobal({ items, ariaLabel }: ISubNavProps) {
  return (
    <Nav aria-label={ariaLabel}>
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
