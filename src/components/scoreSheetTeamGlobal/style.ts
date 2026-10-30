import styled from 'styled-components';

export const Section = styled.section`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Heading = styled.h2`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
  font-size: ${({ theme }) => theme.fontSize.lg}px;
`;

export const Points = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-variant-numeric: tabular-nums;
`;

export const Scroll = styled.div`
  overflow-x: auto;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSize.sm}px;

  th,
  td {
    padding: ${({ theme }) => theme.spacing.xs}px;
    border-bottom: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
    text-align: center;
    white-space: nowrap;
  }

  th {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSize.xs}px;
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

export const PlayerCell = styled.td`
  && {
    max-width: ${({ theme }) => theme.spacing.xxl * 3}px;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
  }
`;

export const Number = styled.td`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const Check = styled.input`
  width: ${({ theme }) => theme.spacing.lg - theme.spacing.xs}px;
  height: ${({ theme }) => theme.spacing.lg - theme.spacing.xs}px;
  accent-color: ${({ theme }) => theme.colors.primary};
`;

export const StatInput = styled.input`
  width: ${({ theme }) => theme.spacing.xxl - theme.spacing.xs}px;
  min-height: ${({ theme }) => theme.sizes.controlHeightSm}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radius.sm}px;
  font-size: ${({ theme }) => theme.fontSize.md}px;
  text-align: center;
`;
