import styled from 'styled-components';

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.spacing.md}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
