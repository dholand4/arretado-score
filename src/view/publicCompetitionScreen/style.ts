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

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
  min-height: ${({ theme }) => theme.sizes.controlHeightSm}px;
`;

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.lg}px;
`;

// Aviso de seção vazia: discreto, sem ocupar o espaço de um bloco inteiro.
export const Empty = styled.p`
  padding: ${({ theme }) => theme.spacing.md}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Rankings = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing.md}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    /* Ranking que sobra sozinho na linha (ex.: só o Cestinha) ocupa a largura toda. */
    & > :last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
  }
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

export const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`;
