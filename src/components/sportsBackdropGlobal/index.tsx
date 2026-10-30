import type { CSSProperties } from 'react';
import { BasketballSvg } from './balls';
import { CourtSvg } from './court';
import { Backdrop, Ball, Court, Glow } from './style';
import type { IBallPath } from './types';

// Trajetos cruzando a tela toda: lado a lado, de cima a baixo e nas diagonais.
// Delay negativo: as bolas já começam espalhadas, sem tela vazia no início.
const BALLS: IBallPath[] = [
  { size: 110, from: [-20, 70], to: [120, 62], duration: 16, delay: -3, opacity: 0.95 },
  { size: 64, from: [120, 18], to: [-20, 30], duration: 19, delay: -11, opacity: 0.7 },
  { size: 80, from: [-15, -20], to: [115, 120], duration: 22, delay: -6, opacity: 0.8 },
  { size: 52, from: [110, 120], to: [-15, -20], duration: 18, delay: -14, opacity: 0.6 },
  { size: 90, from: [30, -25], to: [60, 125], duration: 20, delay: -2, opacity: 0.75 },
  { size: 46, from: [85, 125], to: [70, -25], duration: 15, delay: -9, opacity: 0.55 },
  { size: 70, from: [-20, 40], to: [120, 85], duration: 24, delay: -17, opacity: 0.7 },
  { size: 100, from: [120, 95], to: [-25, 80], duration: 21, delay: -12, opacity: 0.85 },
  { size: 58, from: [-15, 110], to: [115, -15], duration: 17, delay: -5, opacity: 0.65 },
  { size: 40, from: [50, 125], to: [15, -20], duration: 13, delay: -8, opacity: 0.5 },
];

// Giro proporcional ao caminho percorrido: bola menor gira mais.
const spin = ({ size, from, to }: IBallPath) => {
  const distance = Math.hypot(to[0] - from[0], to[1] - from[1]) * 12;
  const turns = distance / (Math.PI * size);
  return `${Math.round(turns * 360) * (to[0] >= from[0] ? 1 : -1)}deg`;
};

// Fundo das telas de acesso: quadra de basquete na tela toda e bolas passando.
export function SportsBackdropGlobal() {
  return (
    <Backdrop aria-hidden="true">
      <Court $vertical={false}>
        <CourtSvg />
      </Court>
      <Court $vertical>
        <CourtSvg vertical />
      </Court>
      <Glow />
      {BALLS.map((ball, index) => (
        <Ball
          key={index}
          style={
            {
              width: ball.size,
              height: ball.size,
              opacity: ball.opacity,
              '--x0': `${ball.from[0]}vw`,
              '--y0': `${ball.from[1]}vh`,
              '--x1': `${ball.to[0]}vw`,
              '--y1': `${ball.to[1]}vh`,
              '--spin': spin(ball),
              '--duration': `${ball.duration}s`,
              '--delay': `${ball.delay}s`,
            } as CSSProperties
          }
        >
          <BasketballSvg />
        </Ball>
      ))}
    </Backdrop>
  );
}

export type { IBallPath } from './types';
