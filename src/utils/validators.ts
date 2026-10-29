import { SENHA_MIN_CARACTERES } from '@/constants/auth';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateNewPassword(senha: string, confirmacao: string): string | null {
  if (senha.length < SENHA_MIN_CARACTERES) {
    return `A senha precisa ter ao menos ${SENHA_MIN_CARACTERES} caracteres.`;
  }
  if (senha !== confirmacao) return 'As senhas não conferem.';
  return null;
}

export interface IUserFormValues {
  nome: string;
  email: string;
  senha: string;
  papel: string;
}

export type UserFormErrors = Partial<Record<keyof IUserFormValues, string>>;

export function validateUserForm(values: IUserFormValues, mode: 'create' | 'edit'): UserFormErrors {
  const errors: UserFormErrors = {};
  if (!values.nome.trim()) errors.nome = 'Informe o nome.';
  if (!values.papel) errors.papel = 'Escolha o papel.';
  if (mode === 'create') {
    if (!isValidEmail(values.email)) errors.email = 'Informe um e-mail válido.';
    if (values.senha.length < SENHA_MIN_CARACTERES) {
      errors.senha = `Mínimo de ${SENHA_MIN_CARACTERES} caracteres.`;
    }
  }
  return errors;
}
