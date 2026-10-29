import styled from 'styled-components';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: 3fr 2fr;
  }
`;

export const Checklist = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const CheckItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Mark = styled.span<{ $done: boolean; $pending: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing.lg}px;
  height: ${({ theme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme, $done, $pending }) =>
    $done ? theme.colors.successSoft : $pending ? theme.colors.surfaceMuted : theme.colors.warningSoft};
  color: ${({ theme, $done, $pending }) =>
    $done ? theme.colors.success : $pending ? theme.colors.textMuted : theme.colors.warning};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const CheckLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

export const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0;
`;

export const Stat = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
`;

export const StatValue = styled.dd`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.xl}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const StatLabel = styled.dt`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Description = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
