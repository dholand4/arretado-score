import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { OfflineNoticeGlobal } from '@/components/offlineNoticeGlobal';
import { appStack } from './AppStack';
import { authStack } from './AuthStack';
import { publicStack } from './PublicStack';
import { MesaLinkScreen, NotFoundScreen, ScoreboardScreen } from './screens';
import { ROUTE_PATTERNS } from './types';

const router = createBrowserRouter([
  publicStack,
  ...authStack,
  appStack,
  // Sem login e sem layout: mesário pelo link e placar em tela cheia (telão).
  { path: ROUTE_PATTERNS.mesaLink, element: <MesaLinkScreen /> },
  { path: ROUTE_PATTERNS.scoreboard, element: <ScoreboardScreen /> },
  { path: '*', element: <NotFoundScreen /> },
]);

export function AppRoutes() {
  // Login, troca de senha e 404 não têm layout: o limite de carregamento fica aqui.
  return (
    <>
      <Suspense fallback={<LoaderGlobal fullScreen />}>
        <RouterProvider router={router} />
      </Suspense>
      <OfflineNoticeGlobal />
    </>
  );
}
