import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Count = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const List = styled.ul`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

// Foto, número e nome na primeira linha; ações embaixo (cabe no celular).
export const Item = styled.li<{ $inactive: boolean }>`
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme, $inactive }) => ($inactive ? theme.colors.surfaceMuted : theme.colors.surface)};
`;

export const Number = styled.span`
  min-width: ${({ theme }) => theme.spacing.xl}px;
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
`;

export const Texts = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

export const Name = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
`;

export const Meta = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Actions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;
