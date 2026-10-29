import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

export const Nav = styled.nav`
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  border-bottom: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;
`;

export const List = styled.ul`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Item = styled(NavLink)`
  display: inline-block;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border-bottom: ${({ theme }) => theme.sizes.focusRing}px solid transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  text-decoration: none;
  white-space: nowrap;

  &.active {
    border-bottom-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text};
  }
`;
