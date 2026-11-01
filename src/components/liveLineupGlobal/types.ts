import type { IOficiaisMesa } from '@/@types/liveSheet';

export interface ILineupTeam {
  id: string;
  nome: string;
  jogadores: { id: string; rotulo: string }[];
}

export interface ILiveLineupProps {
  times: ILineupTeam[];
  escalados: string[];
  oficiais: IOficiaisMesa;
  // Jogadores com lances não podem sair da escalação.
  travados?: string[];
  submitLabel: string;
  saving?: boolean;
  error?: string | null;
  onSubmit: (escalados: string[], oficiais: IOficiaisMesa) => void;
  onCancel?: () => void;
}
