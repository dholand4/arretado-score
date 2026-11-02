import styled from 'styled-components';

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
`;

export const Text = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const LinkBox = styled.code`
  display: block;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  overflow-wrap: anywhere;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;
