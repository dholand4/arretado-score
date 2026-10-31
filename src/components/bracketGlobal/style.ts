import styled, { css, keyframes } from 'styled-components';
import { ARENA } from '@/constants/arena';
import type { BracketSide } from './types';

const COLUMN_WIDTH = 224;
const GAP = 20;
const LINE = 2;

const ARENA_DEEP = ARENA.deep;
const GLASS = ARENA.glass;
const GLASS_STRONG = ARENA.glassStrong;
const GLASS_BORDER = ARENA.glassBorder;
const LINE_COLOR = ARENA.line;
const MUTED = ARENA.muted;
const GOLD = ARENA.gold;
const BRONZE = ARENA.bronze;

const arena = css`
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  color: ${({ theme }) => theme.colors.text};
  background:
    radial-gradient(circle at 50% 50%, transparent 118px, ${GLASS} 119px, ${GLASS} 121px, transparent 122px),
    linear-gradient(90deg, transparent calc(50% - 1px), ${GLASS} calc(50% - 1px), ${GLASS} calc(50% + 1px), transparent calc(50% + 1px)),
    linear-gradient(160deg, ${({ theme }) => theme.colors.surface}, ${({ theme }) => theme.colors.background});
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const Hint = styled.p`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}px) {
    display: none;
  }
`;

// Faixa de uma fase que avança pela campanha: os jogos lado a lado, sem linhas.
export const Round = styled.section`
  ${arena}
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
`;

export const RoundNote = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  text-align: center;
  color: ${MUTED};
`;

export const RoundMatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md}px;
  width: 100%;
`;

export const RoundItem = styled.div`
  width: ${COLUMN_WIDTH}px;
  max-width: 100%;
`;

export const Board = styled.div`
  ${arena}
  overflow-x: auto;
  padding: ${({ theme }) => theme.spacing.lg}px 0;
`;

// Conteúdo rolável da chave: campeão, colunas e 3º lugar centralizados na mesma largura.
export const Track = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
  min-width: 100%;
  margin: 0 auto;
`;

export const Grid = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: center;
  width: max-content;
  min-width: 100%;
  margin: 0 auto;
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: ${COLUMN_WIDTH + GAP * 2}px;
  padding: 0 ${GAP}px;
`;

// Título da rodada em forma de etiqueta; a final e o 3º lugar ganham cor própria.
export const ColumnTitle = styled.h3<{ $tone?: 'final' | 'third' }>`
  align-self: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  padding: ${({ theme }) => theme.spacing.xxs + 1}px ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${GLASS_BORDER};
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${GLASS};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  letter-spacing: 0.1em;
  text-align: center;
  text-transform: uppercase;
  color: ${MUTED};

  ${({ $tone, theme }) =>
    $tone === 'final' &&
    css`
      border-color: transparent;
      background: linear-gradient(135deg, ${theme.colors.primary}, ${GOLD});
      color: ${theme.colors.textInverse};
    `}

  ${({ $tone }) =>
    $tone === 'third' &&
    css`
      border-color: ${BRONZE};
      color: ${BRONZE};
    `}
`;

export const Matches = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const edge = (side: BracketSide) => (side === 'left' ? 'right' : 'left');

// Dois confrontos que levam ao mesmo jogo da rodada seguinte, unidos por um colchete arredondado.
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
        width: ${GAP / 2}px;
        border: ${LINE}px solid ${LINE_COLOR};
        border-${$side === 'left' ? 'left' : 'right'}: none;
        border-radius: ${$side === 'left' ? `0 ${theme.radius.sm}px ${theme.radius.sm}px 0` : `${theme.radius.sm}px 0 0 ${theme.radius.sm}px`};
      }
    `}
`;

// Lugar de um confronto: linha saindo para o centro e, se houver rodada antes, linha chegando.
export const Slot = styled.div<{ $side: BracketSide; $incoming: boolean; $outgoing: boolean }>`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm}px 0;

  ${({ $outgoing, $side }) =>
    $outgoing &&
    $side !== 'center' &&
    css`
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        ${edge($side)}: -${GAP}px;
        width: ${GAP}px;
        border-top: ${LINE}px solid ${LINE_COLOR};
      }
    `}

  ${({ $incoming, $side }) =>
    $incoming &&
    css`
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        ${$side === 'right' ? 'right' : 'left'}: -${GAP}px;
        width: ${GAP}px;
        border-top: ${LINE}px solid ${LINE_COLOR};
      }
    `}

  ${({ $incoming, $side }) =>
    $incoming &&
    $side === 'center' &&
    css`
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        right: -${GAP}px;
        width: ${GAP}px;
        border-top: ${LINE}px solid ${LINE_COLOR};
      }
    `}
`;

// O confronto é um botão: abre a lista de jogos da série.
export const Card = styled.button<{ $highlight?: boolean }>`
  display: block;
  width: 100%;
  overflow: hidden;
  padding: 0;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${GLASS_BORDER};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: transform ${({ theme }) => theme.transition.fast}, border-color ${({ theme }) => theme.transition.fast};

  &:hover {
    transform: translateY(-1px);
    border-color: ${LINE_COLOR};
  }

  ${({ $highlight, theme }) =>
    $highlight &&
    css`
      border: 2px solid transparent;
      background:
        linear-gradient(${ARENA_DEEP}, ${ARENA_DEEP}) padding-box,
        linear-gradient(135deg, ${theme.colors.primary}, ${GOLD}) border-box;
      box-shadow: ${theme.shadows.md};

      &:hover {
        border-color: transparent;
      }
    `}
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.xs + 2}px ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px
    ${({ theme }) => theme.spacing.xxs}px;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  letter-spacing: 0.04em;
  color: ${MUTED};
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

export const Live = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  color: ${({ theme }) => theme.colors.primary};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.primary};
    animation: ${pulse} 1.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`;

export const TeamRow = styled.div<{ $winner: boolean; $loser: boolean; $defined: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  min-height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px 0 ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  opacity: ${({ $loser }) => ($loser ? 0.5 : 1)};
  box-shadow: ${({ $winner, theme }) => ($winner ? `inset 3px 0 0 ${theme.colors.primary}` : 'none')};

  & + & {
    border-top: ${({ theme }) => theme.sizes.borderWidth}px solid ${GLASS};
  }

  & > span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: ${({ theme, $winner }) => ($winner ? theme.fontWeight.bold : theme.fontWeight.medium)};
    font-style: ${({ $defined }) => ($defined ? 'normal' : 'italic')};
    color: ${({ theme, $defined }) => ($defined ? theme.colors.text : MUTED)};
    ${({ $defined, theme }) => !$defined && `font-size: ${theme.fontSize.xs}px;`}
  }

  & > strong {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 26px;
    padding: 0 ${({ theme }) => theme.spacing.xs + 2}px;
    border-radius: ${({ theme }) => theme.radius.sm}px;
    font-variant-numeric: tabular-nums;
    background: ${({ theme, $winner }) =>
      $winner ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})` : GLASS_STRONG};
    color: ${({ theme, $winner }) => ($winner ? theme.colors.textInverse : theme.colors.text)};
  }
`;

// Escudo do time: a logo ou as iniciais.
export const Crest = styled.div<{ $empty: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  overflow: hidden;
  border-radius: 50%;
  background-color: ${({ $empty }) => ($empty ? 'transparent' : GLASS_STRONG)};
  border: ${({ $empty }) => ($empty ? `1px dashed ${LINE_COLOR}` : 'none')};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${MUTED};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Lista de jogos da série (dentro do modal, no tema claro).
export const SeriesSummary = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const GameList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const GameItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md}px;
`;

export const GameTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm}px;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const GameScore = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};

  span:first-child {
    text-align: right;
  }

  strong {
    font-size: ${({ theme }) => theme.fontSize.lg}px;
    font-variant-numeric: tabular-nums;
  }
`;

export const GameAction = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const Center = styled.div`
  display: flex;
  flex-direction: column;
  width: ${COLUMN_WIDTH + 48 + GAP * 2}px;
  padding: 0 ${GAP}px;
`;

export const CenterStack = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

export const Champion = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  text-align: center;

  span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    margin-bottom: ${({ theme }) => theme.spacing.xs}px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, ${GOLD}, ${({ theme }) => theme.colors.primary});
    box-shadow: 0 4px 22px rgba(245, 184, 65, 0.45);
    font-size: 26px;
    line-height: 1;
  }

  small {
    font-size: 11px;
    font-weight: ${({ theme }) => theme.fontWeight.bold};
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${MUTED};
  }

  strong {
    font-size: ${({ theme }) => theme.fontSize.lg}px;
    color: ${GOLD};
  }
`;

// 3º lugar logo abaixo da chave, centralizado (não reserva espaço em volta da final).
export const Third = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: ${COLUMN_WIDTH}px;
  max-width: calc(100% - ${GAP * 2}px);
  margin: ${({ theme }) => theme.spacing.lg}px auto 0;

  & > article {
    align-self: stretch;
  }
`;
