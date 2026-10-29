import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { NotFoundScreen } from '@/view/notFoundScreen';
import { appStack } from './AppStack';
import { authStack } from './AuthStack';
import { publicStack } from './PublicStack';

const router = createBrowserRouter([
  publicStack,
  ...authStack,
  appStack,
  { path: '*', element: <NotFoundScreen /> },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
