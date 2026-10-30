import styled from 'styled-components';

export const Rounds = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sm}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const Round = styled.div`
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const RoundTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.primary};
`;

export const Games = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.md}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

export const Muted = styled.p`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
