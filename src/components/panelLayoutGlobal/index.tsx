import { useState } from 'react';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { useBackTarget } from '@/hooks/useBackNavigation';
import { BackNavigationProvider } from '@/providers/BackNavigationProvider';
import {
  BackLink,
  Backdrop,
  BackButton,
  BarIcon,
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
  TopBarStart,
  TopBarTitle,
  Welcome,
  WelcomeText,
} from './style';
import type { IPanelLayoutProps } from './types';

// Painel com menu lateral: boas-vindas no topo, seções no meio e Sair embaixo.
// No celular o menu vira gaveta, aberta pelo botão da barra superior, que também
// mostra o "‹" de voltar quando a tela aberta define um destino (useBackNavigation).
export function PanelLayoutGlobal(props: IPanelLayoutProps) {
  return (
    <BackNavigationProvider>
      <PanelLayout {...props} />
    </BackNavigationProvider>
  );
}

function PanelLayout({
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
  const back = useBackTarget();

  return (
    <Shell>
      <TopBar>
        <TopBarStart>
          {back && (
            <BackButton to={back.to} aria-label={`Voltar para ${back.label}`}>
              <BarIcon viewBox="0 0 24 24" aria-hidden>
                <path d="M15 5l-7 7 7 7" />
              </BarIcon>
            </BackButton>
          )}
          <TopBarTitle>Bem-vindo, {firstName}!</TopBarTitle>
        </TopBarStart>
        <MenuButton
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="painel-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <BarIcon viewBox="0 0 24 24" aria-hidden>
            <path d={menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
          </BarIcon>
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
