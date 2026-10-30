import styled from 'styled-components';

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl}px;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.lg}px;
`;

export const List = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const Shortcuts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`;
