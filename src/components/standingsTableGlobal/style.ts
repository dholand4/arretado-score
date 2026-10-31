import styled from 'styled-components';
import { ARENA } from '@/constants/arena';

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// Mesmo painel claro dos Playoffs.
export const Scroll = styled.div`
  overflow-x: auto;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-variant-numeric: tabular-nums;

  caption {
    padding: ${({ theme }) => theme.spacing.md}px ${({ theme }) => theme.spacing.md}px 0;
    font-size: 11px;
    font-weight: ${({ theme }) => theme.fontWeight.bold};
    letter-spacing: 0.1em;
    text-align: left;
    text-transform: uppercase;
    color: ${ARENA.muted};
  }

  th,
  td {
    padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xxs}px ${({ theme }) => theme.spacing.sm}px;
    border-bottom: ${({ theme }) => theme.sizes.borderWidth}px solid ${ARENA.glass};
    text-align: center;
    white-space: nowrap;
  }

  th {
    padding-top: ${({ theme }) => theme.spacing.md}px;
    border-bottom-color: ${ARENA.glassBorder};
    font-size: 11px;
    font-weight: ${({ theme }) => theme.fontWeight.bold};
    letter-spacing: 0.08em;
    color: ${ARENA.muted};
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  /* Coluna do time: título alinhado com os nomes. */
  thead th:nth-child(2) {
    text-align: left;
  }
`;

// Quem se classifica é marcado só pela bolinha verde da posição.
export const Row = styled.tr`
  transition: background-color ${({ theme }) => theme.transition.fast};

  &:hover {
    background-color: ${ARENA.glass};
  }
`;

// Posição em círculo: verde para quem se classifica.
export const Position = styled.td<{ $qualified: boolean }>`
  && {
    width: 44px;
  }

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    font-size: ${({ theme }) => theme.fontSize.xs}px;
    font-weight: ${({ theme }) => theme.fontWeight.bold};
    background-color: ${({ $qualified, theme }) => ($qualified ? theme.colors.success : ARENA.glassStrong)};
    color: ${({ $qualified, theme }) => ($qualified ? theme.colors.textInverse : theme.colors.text)};
  }
`;

export const TeamCell = styled.td`
  && {
    min-width: 160px;
    text-align: left;
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
  }

  & > div {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm}px;
  }
`;

export const Points = styled.td`
  && strong {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 26px;
    padding: 0 ${({ theme }) => theme.spacing.xs + 2}px;
    border-radius: ${({ theme }) => theme.radius.sm}px;
    background: linear-gradient(
      135deg,
      ${({ theme }) => theme.colors.primary},
      ${({ theme }) => theme.colors.primaryHover}
    );
    color: ${({ theme }) => theme.colors.textInverse};
    font-weight: ${({ theme }) => theme.fontWeight.bold};
  }
`;

export const Balance = styled.td<{ $value: number }>`
  && {
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    color: ${({ $value, theme }) =>
      $value > 0 ? ARENA.positive : $value < 0 ? ARENA.negative : theme.colors.text};
  }
`;

// Aproveitamento com uma barrinha.
export const Rate = styled.td`
  && {
    min-width: 88px;
  }

  & > div {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs + 2}px;
  }

  i {
    flex: 1;
    height: 4px;
    overflow: hidden;
    border-radius: ${({ theme }) => theme.radius.pill}px;
    background-color: ${ARENA.glassStrong};
  }

  small {
    min-width: 32px;
    font-size: ${({ theme }) => theme.fontSize.xs}px;
    text-align: right;
    color: ${ARENA.muted};
  }
`;

export const RateFill = styled.b<{ $value: number }>`
  display: block;
  width: ${({ $value }) => Math.max(0, Math.min(1, $value)) * 100}%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${ARENA.gold});
`;

export const Note = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs + 2}px;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Dot = styled.span`
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.success};
`;
