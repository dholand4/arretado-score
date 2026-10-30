import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@/providers';
import { AppRoutes } from '@/routes';
import { blockInspect } from '@/utils/blockInspect';

if (import.meta.env.PROD) blockInspect();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </StrictMode>,
);
