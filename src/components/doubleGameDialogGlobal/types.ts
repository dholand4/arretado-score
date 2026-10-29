export interface IDoubleGameDialogProps {
  open: boolean;
  message: string;
  // Quantos jogos cabem sem repetir time (0 = não oferece montar com menos).
  maxWithoutRepeat: number;
  loading?: boolean;
  error?: string | null;
  onAllowDouble: () => void;
  onLimit: () => void;
  onClose: () => void;
}
