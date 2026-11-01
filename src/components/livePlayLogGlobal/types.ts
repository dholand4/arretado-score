export interface ILivePlayItem {
  id: string;
  periodo: string;
  tempo: string;
  texto: string;
  anulado: boolean;
  pendente: boolean;
}

export interface ILivePlayLogProps {
  // Do mais recente para o mais antigo.
  itens: ILivePlayItem[];
  disabled?: boolean;
  onAnular?: (id: string) => void;
}
