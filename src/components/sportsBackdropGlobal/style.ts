import styled, { keyframes } from 'styled-components';

// Cada bola atravessa a tela do ponto de entrada ao de saída, girando como se rolasse.
const travel = keyframes`
  from { transform: translate(var(--x0), var(--y0)) rotate(0deg); }
  to { transform: translate(var(--x1), var(--y1)) rotate(var(--spin)); }
`;

const glow = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.1); }
`;

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 50%, rgba(232, 89, 12, 0.18), transparent 55%),
    linear-gradient(160deg, #0B1324 0%, ${({ theme }) => theme.colors.secondary} 50%, #0F1C36 100%);
`;

export const Court = styled.div<{ $vertical: boolean }>`
  position: absolute;
  inset: 0;
  display: ${({ $vertical }) => ($vertical ? 'none' : 'block')};

  svg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.22);
    stroke-width: 2;
  }

  .pintado {
    fill: rgba(232, 89, 12, 0.14);
    stroke: none;
  }

  @media (orientation: portrait) {
    display: ${({ $vertical }) => ($vertical ? 'block' : 'none')};
  }
`;

export const Glow = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60vmin;
  height: 60vmin;
  margin: -30vmin 0 0 -30vmin;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(232, 89, 12, 0.28), transparent 65%);
  animation: ${glow} 7s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Ball = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.5));
  animation: ${travel} var(--duration) linear var(--delay) infinite;
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: translate(calc((var(--x0) + var(--x1)) / 2), calc((var(--y0) + var(--y1)) / 2));
  }
`;
