import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/constants/theme';
import { createQueryClient } from '@/providers/QueryProvider';

function ThemeWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

// Usa `wrapper` para que `rerender` mantenha o tema.
export function renderWithTheme(ui: ReactElement) {
  return render(ui, { wrapper: ThemeWrapper });
}

export function renderWithRouter(ui: ReactElement, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>,
  );
}

export function createQueryWrapper() {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false } });
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export function renderScreen(ui: ReactElement, initialPath = '/') {
  const QueryWrapper = createQueryWrapper();
  return render(
    <QueryWrapper>
      <MemoryRouter initialEntries={[initialPath]}>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </MemoryRouter>
    </QueryWrapper>,
  );
}
