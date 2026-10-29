import { useState } from 'react';
import { BrandGlobal } from '@/components/brandGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import {
  Header,
  HeaderInner,
  Main,
  MenuButton,
  Nav,
  NavItem,
  Shell,
  UserArea,
  UserInfo,
  UserName,
  UserRole,
} from './style';
import type { IPanelLayoutProps } from './types';

export function PanelLayoutGlobal({
  children,
  userName,
  roleLabel,
  navItems,
  onSignOut,
  signingOut = false,
}: IPanelLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <Shell>
      <Header>
        <HeaderInner>
          <BrandGlobal to="/painel" inverse />
          <MenuButton
            type="button"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="painel-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? '×' : '☰'}
          </MenuButton>
          <Nav id="painel-menu" aria-label="Menu do painel" $open={menuOpen}>
            {navItems.map((item) => (
              <NavItem key={item.to} to={item.to} end={item.end} onClick={closeMenu}>
                {item.label}
              </NavItem>
            ))}
            <UserArea>
              <UserInfo>
                <UserName>{userName}</UserName>
                <UserRole>{roleLabel}</UserRole>
              </UserInfo>
              <ButtonGlobal label="Sair" variant="outline" size="sm" loading={signingOut} onClick={onSignOut} />
            </UserArea>
          </Nav>
        </HeaderInner>
      </Header>
      <Main>{children}</Main>
    </Shell>
  );
}

export type { IPanelLayoutProps, IPanelNavItem } from './types';
