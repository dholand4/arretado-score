import styled, { css } from 'styled-components';
import type { BracketSide } from './types';

const COLUMN_WIDTH = 216;
const GAP = 18;
const LINE = 2;

export const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}px) {
    display: none;
  }
`;

export const Board = styled.div`
  overflow-x: auto;
  padding: ${({ theme }) => theme.spacing.md}px 0;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  background:
    radial-gradient(circle at 50% 45%, ${({ theme }) => theme.colors.primarySoft}, transparent 60%),
    ${({ theme }) => theme.colors.surface};
`;

export const Grid = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  width: max-content;
  min-width: 100%;
  min-height: 380px;
  margin: 0 auto;
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: ${COLUMN_WIDTH + GAP * 2}px;
  padding: 0 ${GAP}px;
`;

export const ColumnTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Matches = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const edge = (side: BracketSide) => (side === 'left' ? 'right' : 'left');

// Dois confrontos que levam ao mesmo jogo da rodada seguinte, unidos por uma linha vertical.
export const Pair = styled.div<{ $side: BracketSide; $joined: boolean }>`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;

  ${({ $joined, $side, theme }) =>
    $joined &&
    css`
      &::after {
        content: '';
        position: absolute;
        top: 25%;
        bottom: 25%;
        ${edge($side)}: -${GAP}px;
        border-${edge($side)}: ${LINE}px solid ${theme.colors.borderStrong};
      }
    `}
`;

// Lugar de um confronto: linha saindo para o centro e, se houver rodada antes, linha chegando.
export const Slot = styled.div<{ $side: BracketSide; $incoming: boolean; $outgoing: boolean }>`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs}px 0;

  ${({ $outgoing, $side, theme }) =>
    $outgoing &&
    $side !== 'center' &&
    css`
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        ${edge($side)}: -${GAP}px;
        width: ${GAP}px;
        border-top: ${LINE}px solid ${theme.colors.borderStrong};
      }
    `}

  ${({ $incoming, $side, theme }) =>
    $incoming &&
    css`
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        ${$side === 'right' ? 'right' : 'left'}: -${GAP}px;
        width: ${GAP}px;
        border-top: ${LINE}px solid ${theme.colors.borderStrong};
      }
    `}

  ${({ $incoming, $side, theme }) =>
    $incoming &&
    $side === 'center' &&
    css`
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        right: -${GAP}px;
        width: ${GAP}px;
        border-top: ${LINE}px solid ${theme.colors.borderStrong};
      }
    `}
`;

export const Card = styled.article<{ $highlight?: boolean }>`
  width: 100%;
  overflow: hidden;
  border: ${({ $highlight }) => ($highlight ? 2 : 1)}px solid
    ${({ theme, $highlight }) => ($highlight ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme, $highlight }) => ($highlight ? theme.shadows.md : theme.shadows.sm)};
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const TeamRow = styled.div<{ $winner: boolean; $loser: boolean; $defined: boolean }>`
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  min-height: 34px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;

  & + & {
    border-top: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  }

  span {
    display: flex;
    flex: 1;
    align-items: center;
    min-width: 0;
    padding: 0 ${({ theme }) => theme.spacing.sm}px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: ${({ theme, $winner }) => ($winner ? theme.fontWeight.bold : theme.fontWeight.medium)};
    font-style: ${({ $defined }) => ($defined ? 'normal' : 'italic')};
    color: ${({ theme, $loser, $defined }) => ($loser || !$defined ? theme.colors.textMuted : theme.colors.text)};
    ${({ $defined, theme }) => !$defined && `font-size: ${theme.fontSize.xs}px;`}
  }

  strong {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    font-variant-numeric: tabular-nums;
    background-color: ${({ theme, $winner }) => ($winner ? theme.colors.primary : theme.colors.surfaceMuted)};
    color: ${({ theme, $winner, $loser }) =>
      $winner ? theme.colors.textInverse : $loser ? theme.colors.textMuted : theme.colors.text};
  }
`;

export const Center = styled.div`
  display: flex;
  flex-direction: column;
  width: ${COLUMN_WIDTH + 40 + GAP * 2}px;
  padding: 0 ${GAP}px;
`;

export const CenterStack = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

export const Champion = styled.div`
  position: absolute;
  bottom: calc(50% + 62px);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs}px;
  text-align: center;

  span {
    font-size: 34px;
    line-height: 1;
  }

  small {
    font-size: ${({ theme }) => theme.fontSize.xs}px;
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    font-size: ${({ theme }) => theme.fontSize.lg}px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Third = styled.div`
  position: absolute;
  top: calc(50% + 64px);
  left: ${({ theme }) => theme.spacing.lg}px;
  right: ${({ theme }) => theme.spacing.lg}px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;
