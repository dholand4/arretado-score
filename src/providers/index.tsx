import type { ReactNode } from 'react';
import { AppThemeProvider } from './AppThemeProvider';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AppThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </AppThemeProvider>
    </QueryProvider>
  );
}
