export interface IStandingsAdjustRow {
  time_id: string;
  nome: string;
  posicao: number;
}

export interface IStandingsAdjustProps {
  tiedRows: IStandingsAdjustRow[];
  busy?: boolean;
  error?: string | null;
  onSave: (timeId: string, prioridade: number) => void;
  onRemove: (timeId: string) => void;
}
