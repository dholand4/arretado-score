import styled from 'styled-components';

export const Box = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Help = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Line = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Buttons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;
