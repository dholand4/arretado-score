import type { RouteObject } from 'react-router-dom';
import { ChangePasswordScreen } from '@/view/changePasswordScreen';
import { LoginScreen } from '@/view/loginScreen';
import { RedirectIfAuthenticated, RequireAuth } from './guards';
import { ROUTES } from './types';

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
