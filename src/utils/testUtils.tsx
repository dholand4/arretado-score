import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, type InitialEntry } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/constants/theme';
import { ConfirmContext, ConfirmProvider } from '@/providers/ConfirmProvider';
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
      <ThemeProvider theme={theme}>
        <ConfirmProvider autoConfirm>{ui}</ConfirmProvider>
      </ThemeProvider>
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

// Para hooks que perguntam antes de salvar (useConfirmAction): confirma na hora, sem diálogo.
export function createConfirmingQueryWrapper() {
  const QueryWrapper = createQueryWrapper();
  const confirmContext = { confirm: () => Promise.resolve(true), autoConfirm: true };
  return function ConfirmingQueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryWrapper>
        <ConfirmContext.Provider value={confirmContext}>{children}</ConfirmContext.Provider>
      </QueryWrapper>
    );
  };
}

// initialPath aceita também { pathname, state } para simular o estado da navegação.
export function renderScreen(ui: ReactElement, initialPath: InitialEntry = '/') {
  const QueryWrapper = createQueryWrapper();
  return render(
    <QueryWrapper>
      <MemoryRouter initialEntries={[initialPath]}>
        <ThemeProvider theme={theme}>
          <ConfirmProvider autoConfirm>{ui}</ConfirmProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryWrapper>,
  );
}
