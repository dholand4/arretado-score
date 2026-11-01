export interface ILivePlayerRow {
  id: string;
  rotulo: string;
  pontos: number;
  faltas: number;
  excluido: boolean;
}

export interface ILiveTeamPanelProps {
  nome: string;
  jogadores: ILivePlayerRow[];
  faltasExclusao: number;
  temposRestantes: number;
  disabled?: boolean;
  onPonto: (jogadorId: string, valor: number) => void;
  onFalta: (jogadorId: string) => void;
  // Abre a escolha de falta técnica, antidesportiva ou desqualificante.
  onOutraFalta: (jogadorId: string) => void;
  onTempo: () => void;
}
