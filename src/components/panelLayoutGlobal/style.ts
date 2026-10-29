import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

export const Shell = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.textInverse};
`;

export const HeaderInner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  max-width: ${({ theme }) => theme.sizes.contentMaxWidth}px;
  min-height: ${({ theme }) => theme.sizes.headerHeight}px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.md}px;
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

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    display: none;
  }
`;

export const Nav = styled.nav<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? 'flex' : 'none')};
  flex-direction: column;
  width: 100%;
  gap: ${({ theme }) => theme.spacing.xs}px;
  padding-bottom: ${({ theme }) => theme.spacing.md}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: auto;
    flex: 1;
    padding-bottom: 0;
  }
`;

export const NavItem = styled(NavLink)`
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
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

export const UserArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  padding-top: ${({ theme }) => theme.spacing.sm}px;
  border-top: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.secondaryHover};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    margin-left: auto;
    padding-top: 0;
    border-top: none;
  }
`;

export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  line-height: ${({ theme }) => theme.lineHeight.tight};
`;

export const UserName = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const UserRole = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  opacity: 0.75;
`;

export const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.sizes.contentMaxWidth}px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
`;
