import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/constants/theme';
import { GlobalStyle } from './globalStyle';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}
