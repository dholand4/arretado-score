import type { IEventoInput } from '@/@types/event';

export interface IEventTeam {
  id: string;
  nome: string;
}

// Jogo que ainda falta e pode entrar no dia (sem dia marcado).
export interface IEventMissingGame {
  id: string;
  timeCasaId: string;
  timeForaId: string;
  confronto: string;
}

export interface IEventFormModalProps {
  open: boolean;
  initialValues: IEventoInput;
  teams?: IEventTeam[];
  missingGames?: IEventMissingGame[];
  saving?: boolean;
  error?: string | null;
  onSubmit: (values: IEventoInput) => void;
  onClose: () => void;
}
