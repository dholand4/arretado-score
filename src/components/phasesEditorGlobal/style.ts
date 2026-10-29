import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export const PhaseList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const AddRow = styled.div`
  display: flex;
  justify-content: flex-start;
`;
