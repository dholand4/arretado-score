import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Papel } from '@/@types/user';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { useAuth } from '@/hooks/useAuth';
import { isRoutePath, ROUTES, type ILoginRouteState } from './types';

function ProfileError() {
  const { retryProfile, signOut } = useAuth();
  return (
    <div>
      <AlertGlobal variant="error" message="Não foi possível carregar seu perfil." />
      <ButtonGlobal label="Tentar novamente" onClick={retryProfile} />
      <ButtonGlobal label="Sair" variant="ghost" onClick={() => void signOut()} />
    </div>
  );
}

// Exige sessão ativa. Com `allowPendingPassword`, permite entrar mesmo com troca de senha pendente.
export function RequireAuth({ allowPendingPassword = false }: { allowPendingPassword?: boolean }) {
  const { status, profile } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoaderGlobal fullScreen />;
  if (status === 'error') return <ProfileError />;
  if (status === 'signedOut' || !profile) {
    const state: ILoginRouteState = { from: location.pathname };
    return <Navigate to={ROUTES.login} replace state={state} />;
  }
  if (profile.precisa_trocar_senha && !allowPendingPassword) {
    return <Navigate to={ROUTES.changePassword} replace />;
  }
  return <Outlet />;
}

export function RequireRole({ roles, children }: { roles: Papel[]; children?: ReactNode }) {
  const { profile } = useAuth();
  if (!profile || !roles.includes(profile.papel)) return <Navigate to={ROUTES.panel} replace />;
  return children ?? <Outlet />;
}

// Quem já está logado volta para a página que pediu o login (ou o painel).
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoaderGlobal fullScreen />;
  if (status === 'signedIn') {
    const from = (location.state as ILoginRouteState | null)?.from;
    return <Navigate to={isRoutePath(from) ? from : ROUTES.panel} replace />;
  }
  return <Outlet />;
}
