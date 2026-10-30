import type { IMarcarPagoInput } from '@/@types/finance';

export interface IMarkPaidModalProps {
  open: boolean;
  description: string;
  defaultDate: string;
  saving?: boolean;
  error?: string | null;
  onSubmit: (input: IMarcarPagoInput) => void;
  onClose: () => void;
}
