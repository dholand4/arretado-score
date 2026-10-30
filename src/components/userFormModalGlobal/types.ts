import type { Papel } from '@/@types/user';

export interface IUserFormSubmit {
  nome: string;
  email: string;
  senha: string;
  papel: Papel;
  // Só dígitos; vazio = sem telefone.
  telefone: string;
}

export interface IUserFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: { nome: string; email: string; papel: Papel; telefone?: string | null };
  submitting?: boolean;
  error?: string | null;
  // Papel fixo (ex.: o master editando a si mesmo não pode mudar o próprio papel).
  lockPapel?: boolean;
  onGeneratePassword: () => string;
  onSubmit: (values: IUserFormSubmit) => void;
  onClose: () => void;
}
