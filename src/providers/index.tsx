import type { ReactNode } from 'react';
import { AppThemeProvider } from './AppThemeProvider';
import { AuthProvider } from './AuthProvider';
import { ConfirmProvider } from './ConfirmProvider';
import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AppThemeProvider>
        <AuthProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </AuthProvider>
      </AppThemeProvider>
    </QueryProvider>
  );
}
