import styled from 'styled-components';

export const List = styled.ol`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0 0 ${({ theme }) => theme.spacing.lg}px;
  padding: 0 0 ${({ theme }) => theme.spacing.xs}px;
  list-style: none;
  overflow-x: auto;
  /* Continua rolando no toque, mas sem a barra visível. */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const StepButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  min-height: ${({ theme }) => theme.sizes.controlHeightSm}px;
  padding: 0 ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme, $active }) => ($active ? theme.fontWeight.semibold : theme.fontWeight.regular)};
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.textMuted};
    border-style: dashed;
  }
`;

export const Number = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing.lg - theme.spacing.xs}px;
  height: ${({ theme }) => theme.spacing.lg - theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.surfaceMuted)};
  color: ${({ theme, $active }) => ($active ? theme.colors.textInverse : theme.colors.textMuted)};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
`;
