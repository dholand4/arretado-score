import styled from 'styled-components';

export const List = styled.ol`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Item = styled.li<{ $anulado: boolean }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.xs}px 0;
  border-bottom: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme, $anulado }) => ($anulado ? theme.colors.textMuted : theme.colors.text)};
  text-decoration: ${({ $anulado }) => ($anulado ? 'line-through' : 'none')};
`;

export const When = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Text = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  min-width: 0;
`;

export const Empty = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;
