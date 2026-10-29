import type { IEvento } from '@/@types/event';

export interface IEventCardProps {
  event: IEvento;
  busy?: boolean;
  onReorder: (jogoIds: string[]) => void;
  onRemoveGame: (jogoId: string) => void;
  onSwap: () => void;
  onRedraw: () => void;
  onPublish: () => void;
  onDelete: () => void;
}
