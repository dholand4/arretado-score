// Trajeto de uma bola: entra por um lado e sai pelo outro (posições em vw/vh).
export interface IBallPath {
  size: number;
  from: [number, number];
  to: [number, number];
  duration: number;
  delay: number;
  opacity: number;
}
