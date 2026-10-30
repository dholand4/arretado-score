export interface IScoreSheetPlayer {
  id: string;
  nome: string;
  apelido: string | null;
  numero: number | null;
}

export interface IScoreSheetCategory {
  id: string;
  nome: string;
  sigla: string;
}

export interface IScoreSheetTeamProps {
  teamName: string;
  score: number;
  // Placar total digitado: o cabeçalho mostra quanto já foi dividido entre os jogadores.
  total?: number | null;
  players: IScoreSheetPlayer[];
  categories: IScoreSheetCategory[];
  present: string[];
  values: Record<string, Record<string, string>>;
  disabled?: boolean;
  onTogglePresent: (playerId: string, present: boolean) => void;
  onChangeValue: (playerId: string, categoryId: string, value: string) => void;
}
