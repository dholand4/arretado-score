import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ICredentials, IProfile } from '@/@types/user';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { authService } from '@/services/authService';
import { AppError } from '@/utils/appError';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'error';

export interface IAuthContext {
  status: AuthStatus;
  session: Session | null;
  profile: IProfile | null;
  notice: string | null;
  signIn: (credentials: ICredentials) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  retryProfile: () => void;
  clearNotice: () => void;
}

export const AuthContext = createContext<IAuthContext | null>(null);

const MSG_DESATIVADO = 'Usuário desativado. Fale com o administrador.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authService
      .getSession()
      .then((s) => active && setSession(s))
      .catch(() => active && setSession(null))
      .finally(() => active && setSessionLoaded(true));
    const unsubscribe = authService.onAuthStateChange((s) => setSession(s));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.profile(userId ?? ''),
    queryFn: () => authService.getProfile(userId as string),
    enabled: Boolean(userId),
  });

  const profile = profileQuery.data ?? null;

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } finally {
      setSession(null);
      queryClient.clear();
    }
  }, [queryClient]);

  // Sessão aberta de alguém que foi desativado depois do login.
  useEffect(() => {
    if (profile && !profile.ativo) {
      void signOut().finally(() => setNotice(MSG_DESATIVADO));
    }
  }, [profile, signOut]);

  const signIn = useCallback(
    async (credentials: ICredentials) => {
      setNotice(null);
      const newSession = await authService.signIn(credentials);
      const loaded = await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.profile(newSession.user.id),
        queryFn: () => authService.getProfile(newSession.user.id),
      });
      if (!loaded.ativo) {
        await signOut();
        throw new AppError(MSG_DESATIVADO);
      }
    },
    [queryClient, signOut],
  );

  const changePassword = useCallback(
    async (newPassword: string) => {
      await authService.changePassword(newPassword);
      if (userId) await queryClient.refetchQueries({ queryKey: QUERY_KEYS.profile(userId) });
    },
    [queryClient, userId],
  );

  let status: AuthStatus;
  if (!sessionLoaded || (userId && profileQuery.isPending)) status = 'loading';
  else if (!session || (profile && !profile.ativo)) status = 'signedOut';
  else if (profileQuery.isError) status = 'error';
  else status = 'signedIn';

  const { refetch } = profileQuery;
  const value = useMemo<IAuthContext>(
    () => ({
      status,
      session,
      profile,
      notice,
      signIn,
      signOut,
      changePassword,
      retryProfile: () => void refetch(),
      clearNotice: () => setNotice(null),
    }),
    [status, session, profile, notice, signIn, signOut, changePassword, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
