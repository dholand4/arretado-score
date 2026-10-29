import type { IJogoResumo } from '@/@types/event';

export interface ISwapGameModalProps {
  open: boolean;
  games: IJogoResumo[];
  candidates: IJogoResumo[];
  loadingCandidates?: boolean;
  saving?: boolean;
  error?: string | null;
  onConfirm: (saiId: string, entraId: string) => void;
  onClose: () => void;
}
