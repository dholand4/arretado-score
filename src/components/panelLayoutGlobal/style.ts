import { Link, NavLink } from 'react-router-dom';
import styled from 'styled-components';

const SIDEBAR_WIDTH = 248;

export const Shell = styled.div`
  min-height: ${({ theme }) => theme.safeArea.viewportHeight};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    display: grid;
    grid-template-columns: ${SIDEBAR_WIDTH}px minmax(0, 1fr);
  }
`;

// Barra fina só no celular, com o botão que abre o menu.
export const TopBar = styled.header`
  position: sticky;
  top: ${({ theme }) => theme.safeArea.top};
  z-index: ${({ theme }) => theme.zIndex.header};
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: ${({ theme }) => theme.sizes.headerHeight}px;
  padding: 0 ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.secondary};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    display: none;
  }
`;

export const TopBarTitle = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textInverse};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const MenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: ${({ theme }) => theme.sizes.controlHeight}px;
  min-height: ${({ theme }) => theme.sizes.controlHeight}px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSize.xl}px;
  cursor: pointer;
`;

export const Backdrop = styled.div<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? 'block' : 'none')};
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal - 2};
  background-color: ${({ theme }) => theme.colors.overlay};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    display: none;
  }
`;

export const Sidebar = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: ${({ theme }) => theme.safeArea.top};
  bottom: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndex.modal - 1};
  display: flex;
  flex-direction: column;
  width: min(${SIDEBAR_WIDTH + 32}px, 85vw);
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
  padding-bottom: calc(${({ theme }) => theme.spacing.lg}px + ${({ theme }) => theme.safeArea.bottom});
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.textInverse};
  overflow-y: auto;
  transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
  transition: transform ${({ theme }) => theme.transition.fast};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    position: sticky;
    width: auto;
    height: ${({ theme }) => theme.safeArea.viewportHeight};
    transform: none;
  }
`;

export const Welcome = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  padding-bottom: ${({ theme }) => theme.spacing.md}px;
  border-bottom: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.secondaryHover};
`;

export const WelcomeText = styled.span`
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Role = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  opacity: 0.75;
`;

export const Nav = styled.nav`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg}px;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs}px;
`;

export const BackLink = styled(Link)`
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  text-decoration: none;
  opacity: 0.7;

  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
`;

export const SectionTitle = styled.div`
  overflow-wrap: anywhere;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.8;
`;

export const Item = styled(NavLink)`
  display: block;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xxs}px ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  text-decoration: none;
  opacity: 0.85;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondaryHover};
    opacity: 1;
  }

  &.active {
    background-color: ${({ theme }) => theme.colors.primary};
    opacity: 1;
  }
`;

export const Footer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg}px;
  padding-top: ${({ theme }) => theme.spacing.md}px;
  border-top: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.secondaryHover};
`;

export const Main = styled.main`
  width: 100%;
  max-width: ${({ theme }) => theme.sizes.contentMaxWidth}px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
`;
