import type { Tables } from './database';

export type Papel = 'master' | 'admin' | 'dono_time';

// criado_por é interno (separa as equipes por coordenador); a interface não usa.
export type IProfile = Omit<Tables<'profiles'>, 'papel' | 'criado_por'> & { papel: Papel };

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
  telefone?: string;
}

export interface IUpdateUserInput {
  id: string;
  nome?: string;
  papel?: Papel;
  ativo?: boolean;
  // Vazio/nulo limpa o telefone. O coordenador só pode mandar este campo (e o id).
  telefone?: string | null;
}

export interface IResetPasswordInput {
  id: string;
  senha: string;
}
