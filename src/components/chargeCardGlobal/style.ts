import styled from 'styled-components';

export const Card = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px ${({ theme }) => theme.spacing.md}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  list-style: none;
`;

export const Top = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Title = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Amount = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const Meta = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;
