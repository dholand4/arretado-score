import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { edgeFade } from '@/utils/edgeFade';

export const Nav = styled.nav<{ $fadeStart: boolean; $fadeEnd: boolean }>`
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  border-bottom: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;
  /* Continua rolando no toque, mas sem a barra visível. */
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  ${edgeFade}
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
