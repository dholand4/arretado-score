import type { Tables } from './database';

export type Papel = 'master' | 'admin' | 'dono_time';

export type IProfile = Omit<Tables<'profiles'>, 'papel'> & { papel: Papel };

export interface IUsuarioListado extends Omit<IProfile, 'created_at'> {
  email: string;
  created_at: string;
  ultimo_acesso: string | null;
}

export interface ICredentials {
  email: string;
  password: string;
}

export interface ICreateUserInput {
  nome: string;
  email: string;
  senha: string;
  papel: Papel;
}

export interface IUpdateUserInput {
  id: string;
  nome?: string;
  papel?: Papel;
  ativo?: boolean;
}

export interface IResetPasswordInput {
  id: string;
  senha: string;
}
