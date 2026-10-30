import styled from 'styled-components';

// Fica preso abaixo do cabeçalho do painel enquanto a súmula rola.
export const Board = styled.div`
  position: sticky;
  top: calc(${({ theme }) => theme.sizes.headerHeight}px + ${({ theme }) => theme.safeArea.top});
  z-index: ${({ theme }) => theme.zIndex.header - 1};
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0 ${({ theme }) => -theme.spacing.md}px ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px ${({ theme }) => theme.spacing.md}px;
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.textInverse};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

export const Team = styled.span<{ $align: 'left' | 'right' }>`
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  text-align: ${({ $align }) => $align};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Score = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxl}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const Subtitle = styled.span`
  grid-column: 1 / -1;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  text-align: center;
  opacity: 0.8;
`;
