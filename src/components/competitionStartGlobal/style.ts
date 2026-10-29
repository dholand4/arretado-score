import styled from 'styled-components';

export const Text = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Blockers = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.md}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.warning};
`;

export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;
