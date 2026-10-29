import type { IJogador } from '@/@types/competition';

export interface IRosterProps {
  players: IJogador[];
  canDelete?: boolean;
  busy?: boolean;
  onAdd: () => void;
  onEdit: (player: IJogador) => void;
  onToggleActive: (player: IJogador) => void;
  onDelete?: (player: IJogador) => void;
}
