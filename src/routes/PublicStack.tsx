import { Outlet, type RouteObject } from 'react-router-dom';
import { PublicLayoutGlobal } from '@/components/publicLayoutGlobal';
import { useAuth } from '@/hooks/useAuth';
import { HomeScreen } from '@/view/homeScreen';
import { ROUTES } from './types';

function PublicLayoutRoute() {
  const { status } = useAuth();
  const accountLink =
    status === 'signedIn' ? { to: ROUTES.panel, label: 'Painel' } : { to: ROUTES.login, label: 'Entrar' };
  return (
    <PublicLayoutGlobal accountLink={accountLink}>
      <Outlet />
    </PublicLayoutGlobal>
  );
}

export const publicStack: RouteObject = {
  element: <PublicLayoutRoute />,
  children: [{ path: ROUTES.home, element: <HomeScreen /> }],
};
