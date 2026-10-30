import { useState } from 'react';
import { ButtonGlobal } from '@/components/buttonGlobal';
import {
  BackLink,
  Backdrop,
  Footer,
  Item,
  Main,
  MenuButton,
  Nav,
  Role,
  Section,
  SectionTitle,
  Shell,
  Sidebar,
  TopBar,
  TopBarTitle,
  Welcome,
  WelcomeText,
} from './style';
import type { IPanelLayoutProps } from './types';

// Painel com menu lateral: boas-vindas no topo, seções no meio e Sair embaixo.
// No celular o menu vira gaveta, aberta pelo botão da barra superior.
export function PanelLayoutGlobal({
  children,
  userName,
  roleLabel,
  sections,
  onSignOut,
  signingOut = false,
}: IPanelLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const firstName = userName.split(' ')[0];

  return (
    <Shell>
      <TopBar>
        <TopBarTitle>Bem-vindo, {firstName}!</TopBarTitle>
        <MenuButton
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="painel-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? '×' : '☰'}
        </MenuButton>
      </TopBar>
      <Backdrop $open={menuOpen} onClick={closeMenu} />

      <Sidebar id="painel-menu" $open={menuOpen} aria-label="Menu do painel">
        <Welcome>
          <WelcomeText>Bem-vindo, {firstName}!</WelcomeText>
          <Role>{roleLabel}</Role>
        </Welcome>
        <Nav>
          {sections.map((section) => (
            <Section key={section.key}>
              {section.back && (
                <BackLink to={section.back.to} onClick={closeMenu}>
                  ← {section.back.label}
                </BackLink>
              )}
              {section.title && (
<SectionTitle>{section.title}</SectionTitle>
              )}
              {section.items.map((item) => (
                <Item key={item.to} to={item.to} end={item.end} onClick={closeMenu}>
                  {item.label}
                </Item>
              ))}
            </Section>
          ))}
        </Nav>
        <Footer>
          <ButtonGlobal label="Sair" variant="outline" fullWidth loading={signingOut} onClick={onSignOut} />
        </Footer>
      </Sidebar>

      <Main>{children}</Main>
    </Shell>
  );
}

export type { IPanelLayoutProps, IPanelNavItem, IPanelNavSection } from './types';
