import type { IEvento } from '@/@types/event';

export interface IEventArtModalProps {
  open: boolean;
  // Dia publicado com jogos.
  event: IEvento;
  league: { nome: string; logo_url: string | null };
  onClose: () => void;
}
