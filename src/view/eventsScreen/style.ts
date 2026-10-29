import styled from 'styled-components';

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export const Feedback = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;
