import type { ICategoriaInput } from '@/@types/competition';

export interface ICategoryFormModalProps {
  open: boolean;
  initialValues?: ICategoriaInput;
  isScoreCategory?: boolean;
  saving?: boolean;
  error?: string | null;
  onSubmit: (values: ICategoriaInput) => void;
  onClose: () => void;
}
