import styled from 'styled-components';

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
  background: ${({ theme }) => theme.colors.background};
`;
