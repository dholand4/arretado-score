import type { RouteObject } from 'react-router-dom';
import { RedirectIfAuthenticated, RequireAuth } from './guards';
import { ROUTES } from './types';
import { ChangePasswordScreen, LoginScreen } from './screens';

export const authStack: RouteObject[] = [
  {
    element: <RedirectIfAuthenticated />,
    children: [{ path: ROUTES.login, element: <LoginScreen /> }],
  },
  {
    element: <RequireAuth allowPendingPassword />,
    children: [{ path: ROUTES.changePassword, element: <ChangePasswordScreen /> }],
  },
];
