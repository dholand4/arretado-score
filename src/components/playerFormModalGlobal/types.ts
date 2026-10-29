import type { IJogador, IJogadorInput, ImageChange } from '@/@types/competition';

export interface IPlayerFormModalProps {
  open: boolean;
  player?: IJogador;
  saving?: boolean;
  error?: string | null;
  onSubmit: (values: IJogadorInput, photo: ImageChange) => void;
  onClose: () => void;
}
