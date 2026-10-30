import styled from 'styled-components';

export const Grid = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0 0 ${({ theme }) => theme.spacing.lg}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export const Card = styled.div<{ $tone: 'neutral' | 'success' | 'warning' | 'danger' }>`
  display: flex;
  flex-direction: column-reverse;
  gap: ${({ theme }) => theme.spacing.xxs}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-left: ${({ theme }) => theme.spacing.xs}px solid
    ${({ theme, $tone }) =>
      ({ neutral: theme.colors.secondary, success: theme.colors.success, warning: theme.colors.warning, danger: theme.colors.danger })[$tone]};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const Value = styled.dd`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  font-variant-numeric: tabular-nums;
`;

export const Label = styled.dt`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
