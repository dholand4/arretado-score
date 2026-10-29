import styled from 'styled-components';

export const Bar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding-top: ${({ theme }) => theme.spacing.md}px;
  border-top: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
`;

export const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
