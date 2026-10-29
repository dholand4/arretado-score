import styled from 'styled-components';

export const Sections = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const List = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.md}px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

export const Term = styled.dt`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Value = styled.dd`
  margin: 0;
  word-break: break-word;
`;

export const Muted = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
