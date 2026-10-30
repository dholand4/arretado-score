import styled from 'styled-components';

export const Filters = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const Count = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const List = styled.ul`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0 0 ${({ theme }) => theme.spacing.lg}px;
  padding: 0;
  list-style: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const Adjustments = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
`;
