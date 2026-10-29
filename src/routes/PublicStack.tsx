import { Outlet, type RouteObject } from 'react-router-dom';
import { PublicLayoutGlobal } from '@/components/publicLayoutGlobal';
import { useAuth } from '@/hooks/useAuth';
import { HomeScreen } from '@/view/homeScreen';
import { PublicStandingsScreen } from '@/view/publicStandingsScreen';
import { ROUTE_PATTERNS, ROUTES } from './types';

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
  children: [
    { path: ROUTES.home, element: <HomeScreen /> },
    // Etapa 4
    { path: ROUTE_PATTERNS.publicStandings, element: <PublicStandingsScreen /> },
  ],
};
