export interface IResetPasswordModalProps {
  open: boolean;
  userName: string;
  submitting?: boolean;
  error?: string | null;
  onGeneratePassword: () => string;
  onSubmit: (senha: string) => void;
  onClose: () => void;
}
