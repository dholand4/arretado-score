import type { IEventoInput } from '@/@types/event';

export interface IEventFormModalProps {
  open: boolean;
  initialValues: IEventoInput;
  saving?: boolean;
  error?: string | null;
  onSubmit: (values: IEventoInput) => void;
  onClose: () => void;
}
