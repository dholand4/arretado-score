import styled, { css } from 'styled-components';

type Tamanho = { $telao: boolean };

// No telão as medidas acompanham a tela (vmin): o placar é lido de longe, em pé ou deitado.
const medida = (telao: boolean, vmin: number, px: number) => (telao ? `${vmin}vmin` : `${px}px`);

const digitos = css`
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  line-height: 1;
`;

export const Board = styled.section<Tamanho>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: ${({ $telao, theme }) => medida($telao, 3, theme.spacing.sm)};
  padding: ${({ $telao, theme }) => medida($telao, 4, theme.spacing.md)};
  border-radius: ${({ $telao, theme }) => ($telao ? '0' : `${theme.radius.lg}px`)};
  background: radial-gradient(120% 90% at 50% 0%, ${({ theme }) => theme.colors.secondaryHover} 0%,
    ${({ theme }) => theme.colors.secondary} 55%, #0e1424 100%);
  color: ${({ theme }) => theme.colors.textInverse};
  ${({ $telao }) =>
    $telao &&
    css`
      min-height: 100%;
    `}
`;

export const Team = styled.div<Tamanho>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ $telao, theme }) => medida($telao, 1.5, theme.spacing.xs)};
  min-width: 0;
  text-align: center;
`;

export const Crest = styled.div<Tamanho>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $telao }) => medida($telao, 20, 56)};
  height: ${({ $telao }) => medida($telao, 20, 56)};
  overflow: hidden;
  border: ${({ $telao }) => medida($telao, 0.6, 2)} solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.secondary};
  font-size: ${({ $telao }) => medida($telao, 7, 20)};
  font-weight: ${({ theme }) => theme.fontWeight.bold};

  img {
    width: 86%;
    height: 86%;
    object-fit: contain;
  }
`;

export const TeamName = styled.h2<Tamanho>`
  max-width: 100%;
  overflow: hidden;
  font-size: ${({ $telao, theme }) => medida($telao, 4.2, theme.fontSize.sm)};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const Score = styled.output<Tamanho>`
  ${digitos};
  font-size: ${({ $telao }) => medida($telao, 22, 44)};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const Stats = styled.div<Tamanho>`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ $telao, theme }) => medida($telao, 2, theme.spacing.sm)};
  font-size: ${({ $telao, theme }) => medida($telao, 2.6, theme.fontSize.xs)};
  color: rgba(255, 255, 255, 0.75);
`;

export const Dots = styled.span`
  display: inline-flex;
  gap: 0.25em;
`;

export const Dot = styled.span<{ $cheio: boolean }>`
  width: 0.7em;
  height: 0.7em;
  border-radius: 50%;
  background-color: ${({ $cheio, theme }) => ($cheio ? theme.colors.primary : 'rgba(255, 255, 255, 0.2)')};
`;

export const Bonus = styled.span`
  padding: 0 0.5em;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textInverse};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const Center = styled.div<Tamanho>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ $telao, theme }) => medida($telao, 1.5, theme.spacing.xs)};
`;

export const Situation = styled.span<Tamanho & { $aoVivo: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.15em 0.7em;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ $aoVivo, theme }) => ($aoVivo ? theme.colors.danger : 'rgba(255, 255, 255, 0.15)')};
  font-size: ${({ $telao, theme }) => medida($telao, 2.4, theme.fontSize.xs)};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const Period = styled.span<Tamanho>`
  font-size: ${({ $telao, theme }) => medida($telao, 3.4, theme.fontSize.sm)};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: rgba(255, 255, 255, 0.85);
`;

export const GameClock = styled.output<Tamanho & { $rodando: boolean }>`
  ${digitos};
  padding: 0.08em 0.3em;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: rgba(0, 0, 0, 0.35);
  color: ${({ $rodando, theme }) => ($rodando ? theme.colors.textInverse : '#ffd8a8')};
  font-size: ${({ $telao }) => medida($telao, 15, 32)};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const ShotClock = styled.output<Tamanho & { $alerta: boolean }>`
  ${digitos};
  min-width: 2.2em;
  padding: 0.08em 0.3em;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: rgba(0, 0, 0, 0.35);
  color: ${({ $alerta, theme }) => ($alerta ? theme.colors.danger : '#ffa94d')};
  font-size: ${({ $telao }) => medida($telao, 9, 20)};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  text-align: center;
`;
