import type { IEvento } from '@/@types/event';

export interface IEventCardProps {
  event: IEvento;
  busy?: boolean;
  onReorder: (jogoIds: string[]) => void;
  onRemoveGame: (jogoId: string) => void;
  onSwap: () => void;
  onRedraw: () => void;
  onPublish: () => void;
  // Mudar data, hora, local, intervalo e observações (rascunho ou publicado).
  onEdit: () => void;
  onDelete: () => void;
  // Arte de divulgação (só em dia publicado com jogos).
  onGenerateArt?: () => void;
}
