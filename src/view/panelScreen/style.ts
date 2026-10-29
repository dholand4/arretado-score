import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

export const Grid = styled.ul`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const tile = css`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  height: 100%;
  padding: ${({ theme }) => theme.spacing.md}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
`;

export const ShortcutLink = styled(Link)`
  ${tile}
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: border-color ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const ShortcutDisabled = styled.div`
  ${tile}
  opacity: 0.65;
`;

export const ShortcutTitle = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const ShortcutText = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
