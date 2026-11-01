import { FunctionsHttpError } from '@supabase/supabase-js';
import type {
  ICreateUserInput,
  ILigaUsuarios,
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

  // Ligas e quem pertence a cada uma (coordenadores e donos de time), para filtrar a lista.
  async listLeagues(): Promise<ILigaUsuarios[]> {
    const [competicoes, admins, times] = await Promise.all([
      supabase.from('competicoes').select('id, nome').order('nome'),
      supabase.from('competicao_admins').select('competicao_id, user_id'),
      supabase.from('times').select('competicao_id, dono_id').not('dono_id', 'is', null),
    ]);
    for (const result of [competicoes, admins, times]) if (result.error) throw result.error;
    const vinculos = [
      ...(admins.data ?? []).map((a) => [a.competicao_id, a.user_id] as const),
      ...(times.data ?? []).map((t) => [t.competicao_id, t.dono_id as string] as const),
    ];
    return (competicoes.data ?? []).map((c) => ({
      id: c.id,
      nome: c.nome,
      usuarios: [...new Set(vinculos.filter(([ligaId]) => ligaId === c.id).map(([, userId]) => userId))],
    }));
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
