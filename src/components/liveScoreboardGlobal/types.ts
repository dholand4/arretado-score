export interface ILiveScoreboardTeam {
  nome: string;
  placar: number;
  faltas: number;
  emBonus: boolean;
  temposUsados: number;
  temposLimite: number;
}

export interface ILiveScoreboardProps {
  casa: ILiveScoreboardTeam;
  fora: ILiveScoreboardTeam;
  periodo: string;
  jogoMs: number;
  // Nulo quando a liga não usa o relógio de posse.
  posseMs: number | null;
  posseSegundos: number;
  posseCurta: number;
  rodando: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onAjustarJogo: (deltaMs: number) => void;
  onPosse: (segundos: number) => void;
  onAjustarPosse: (deltaMs: number) => void;
}
