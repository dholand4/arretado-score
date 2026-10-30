import { Link } from 'react-router-dom';
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
`;

export const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md}px;
  min-height: ${({ theme }) => theme.sizes.headerHeight}px;
  padding: 0 ${({ theme }) => theme.spacing.md}px;

  /* Nome no canto esquerdo e Entrar no canto direito, na largura toda. */
  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    padding: 0 ${({ theme }) => theme.spacing.xl}px;
  }
`;

export const AccountLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.secondaryHover};
  border-radius: ${({ theme }) => theme.radius.md}px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondaryHover};
  }
`;

export const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.sizes.contentMaxWidth}px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
`;

export const Footer = styled.footer`
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
