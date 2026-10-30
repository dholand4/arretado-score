import styled from 'styled-components';

export const Filters = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const Feedback = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

export const List = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0;
  padding: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
