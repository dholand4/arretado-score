import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px ${({ theme }) => theme.spacing.md}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Matchup = styled.span`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Team = styled.span<{ $align: 'left' | 'right' }>`
  overflow: hidden;
  text-align: ${({ $align }) => $align};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Score = styled.span`
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const Footer = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Action = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;
