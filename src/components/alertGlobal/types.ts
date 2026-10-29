export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface IAlertProps {
  message: string;
  variant?: AlertVariant;
  title?: string;
  onClose?: () => void;
}
