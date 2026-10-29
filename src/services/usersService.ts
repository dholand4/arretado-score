import { FunctionsHttpError } from '@supabase/supabase-js';
import type {
  ICreateUserInput,
  IProfile,
  IResetPasswordInput,
  IUpdateUserInput,
  IUsuarioListado,
} from '@/@types/user';
import { AppError } from '@/utils/appError';
import { supabase } from './supabaseService';

type AdminUsersAction =
  | ({ action: 'create' } & ICreateUserInput)
  | ({ action: 'update' } & IUpdateUserInput)
  | ({ action: 'reset_password' } & IResetPasswordInput);

async function invokeAdminUsers<T>(body: AdminUsersAction): Promise<T> {
  const { data, error } = await supabase.functions.invoke<{ data: T }>('admin-users', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload: unknown = await error.context.json().catch(() => null);
      const message = (payload as { error?: unknown } | null)?.error;
      if (typeof message === 'string') throw new AppError(message);
    }
    throw error;
  }
  if (!data) throw new AppError('Resposta vazia do servidor.');
  return data.data;
}

export const usersService = {
  async list(): Promise<IUsuarioListado[]> {
    const { data, error } = await supabase.rpc('listar_usuarios');
    if (error) throw error;
    return data as IUsuarioListado[];
  },

  create(input: ICreateUserInput) {
    return invokeAdminUsers<IProfile & { email: string }>({ action: 'create', ...input });
  },

  update(input: IUpdateUserInput) {
    return invokeAdminUsers<IProfile>({ action: 'update', ...input });
  },

  resetPassword(input: IResetPasswordInput) {
    return invokeAdminUsers<IProfile>({ action: 'reset_password', ...input });
  },
};
