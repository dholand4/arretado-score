import type { Session } from '@supabase/supabase-js';
import type { ICredentials, IProfile } from '@/@types/user';
import { AppError } from '@/utils/appError';
import { supabase } from './supabaseService';

export const authService = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
  },

  async signIn({ email, password }: ICredentials): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data.session;
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getProfile(userId: string): Promise<IProfile> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError('Perfil não encontrado. Fale com o administrador.');
    return data as IProfile;
  },

  // A trigger on_auth_user_password_changed zera precisa_trocar_senha no banco.
  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};
