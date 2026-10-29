import type { IFase } from '@/@types/phase';

export interface IGroupsCardProps {
  phase: IFase;
  // Motivo para não permitir sortear de novo (ex.: já há súmula).
  blockedReason?: string | null;
  busy?: boolean;
  onRedraw: () => void;
}
