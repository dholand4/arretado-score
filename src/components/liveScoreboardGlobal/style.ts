import styled, { css } from 'styled-components';

export const Board = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.sm + theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radius.lg}px;
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.textInverse};
  box-shadow: ${({ theme }) => theme.shadows.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    gap: ${({ theme }) => theme.spacing.lg}px;
    padding: ${({ theme }) => theme.spacing.md}px ${({ theme }) => theme.spacing.lg}px;
  }
`;

export const Team = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  min-width: 0;
  text-align: center;
`;

export const TeamName = styled.h2`
  max-width: 100%;
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    font-size: ${({ theme }) => theme.fontSize.lg}px;
  }
`;

const digits = css`
  font-variant-numeric: tabular-nums;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: ${({ theme }) => theme.lineHeight.tight};
`;

export const Score = styled.output`
  ${digits};
  font-size: ${({ theme }) => theme.fontSize.xxl * 1.5}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    font-size: ${({ theme }) => theme.fontSize.xxl * 2.5}px;
  }
`;

// Escudo + placar: o escudo fica do lado de fora (casa à esquerda, visitante à direita).
export const ScoreRow = styled.div<{ $lado: 'casa' | 'fora' }>`
  display: flex;
  flex-direction: ${({ $lado }) => ($lado === 'casa' ? 'row' : 'row-reverse')};
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// No celular a coluna é estreita demais: o escudo aparece a partir do tablet.
export const Crest = styled.span`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    display: inline-flex;
  }

  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing.xxs}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Meta = styled.span`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  opacity: 0.9;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    font-size: ${({ theme }) => theme.fontSize.sm}px;
  }
`;

export const Bonus = styled.strong`
  padding: 0 ${({ theme }) => theme.spacing.xs}px;
  border-radius: ${({ theme }) => theme.radius.sm}px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textInverse};
`;

export const Center = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

export const Period = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  text-transform: uppercase;
  opacity: 0.85;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    font-size: ${({ theme }) => theme.fontSize.sm}px;
  }
`;

export const GameClock = styled.output<{ $rodando: boolean }>`
  ${digits};
  font-size: ${({ theme }) => theme.fontSize.xxl * 1.4}px;
  color: ${({ theme, $rodando }) => ($rodando ? theme.colors.textInverse : theme.colors.warningSoft)};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    font-size: ${({ theme }) => theme.fontSize.xxl * 2.2}px;
  }
`;

export const ShotClock = styled.output<{ $desligado: boolean }>`
  ${digits};
  min-width: 2.5ch;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radius.sm}px;
  background-color: rgba(0, 0, 0, 0.3);
  font-size: ${({ theme }) => theme.fontSize.xxl}px;
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
  opacity: ${({ $desligado }) => ($desligado ? 0.35 : 1)};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
    font-size: ${({ theme }) => theme.fontSize.xxl * 1.5}px;
  }
`;

export const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

export const ClockButton = styled.button<{ $primary?: boolean }>`
  min-width: ${({ theme }) => theme.sizes.controlHeight}px;
  min-height: ${({ theme }) => theme.sizes.controlHeight}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  border: ${({ theme }) => theme.sizes.borderWidth}px solid rgba(255, 255, 255, 0.35);
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme, $primary }) => ($primary ? theme.colors.primary : 'transparent')};
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;
  touch-action: manipulation;

  &:hover:not(:disabled) {
    background-color: ${({ theme, $primary }) => ($primary ? theme.colors.primaryHover : 'rgba(255, 255, 255, 0.12)')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.sizes.focusRing}px solid ${({ theme }) => theme.colors.focus};
  }
`;

export const StartButton = styled(ClockButton)`
  min-width: ${({ theme }) => theme.sizes.controlHeight * 3}px;
  font-size: ${({ theme }) => theme.fontSize.md}px;
`;
