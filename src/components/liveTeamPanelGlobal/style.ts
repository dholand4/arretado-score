import styled from 'styled-components';

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
  min-width: 0;
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

export const Title = styled.h2`
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Rows = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Row = styled.li<{ $excluido: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme, $excluido }) => ($excluido ? theme.colors.dangerSoft : theme.colors.surface)};
`;

export const Player = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const PlayerName = styled.span`
  overflow: hidden;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PlayerStats = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Fouls = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xxs}px;
`;

export const FoulDot = styled.span<{ $on: boolean }>`
  width: ${({ theme }) => theme.spacing.sm}px;
  height: ${({ theme }) => theme.spacing.sm}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme, $on }) => ($on ? theme.colors.danger : 'transparent')};
`;

export const Excluded = styled.strong`
  color: ${({ theme }) => theme.colors.danger};
`;

export const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

export const Action = styled.button<{ $tone: 'ponto' | 'falta' | 'mais' }>`
  min-width: ${({ theme }) => theme.sizes.controlHeight}px;
  min-height: ${({ theme }) => theme.sizes.controlHeight}px;
  padding: 0 ${({ theme }) => theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid
    ${({ theme, $tone }) => ($tone === 'ponto' ? theme.colors.primary : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme, $tone }) =>
    $tone === 'ponto' ? theme.colors.primarySoft : $tone === 'falta' ? theme.colors.dangerSoft : theme.colors.surface};
  color: ${({ theme, $tone }) =>
    $tone === 'ponto' ? theme.colors.primary : $tone === 'falta' ? theme.colors.danger : theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;
  touch-action: manipulation;

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.sizes.focusRing}px solid ${({ theme }) => theme.colors.focus};
  }
`;
