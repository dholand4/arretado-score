import styled from 'styled-components';

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
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
  font-variant-numeric: tabular-nums;

  caption {
    padding: ${({ theme }) => theme.spacing.sm}px;
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    text-align: left;
  }

  th,
  td {
    padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.xs + theme.spacing.xxs}px;
    border-bottom: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
    text-align: center;
    white-space: nowrap;
  }

  th {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSize.xs}px;
  }
`;

export const Row = styled.tr<{ $qualified: boolean }>`
  background-color: ${({ theme, $qualified }) => ($qualified ? theme.colors.successSoft : 'transparent')};
`;

export const TeamCell = styled.td`
  && {
    text-align: left;
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
  }
`;

export const Points = styled.td`
  && {
    font-weight: ${({ theme }) => theme.fontWeight.bold};
  }
`;

export const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
