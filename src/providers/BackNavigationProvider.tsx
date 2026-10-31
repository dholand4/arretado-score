import { createContext, useMemo, useState, type ReactNode } from 'react';
import type { RoutePath } from '@/routes/types';

export interface IBackTarget {
  to: RoutePath;
  label: string;
}

export interface IBackNavigationContext {
  target: IBackTarget | null;
  setTarget: (target: IBackTarget | null) => void;
}

export const BackNavigationContext = createContext<IBackNavigationContext | null>(null);

// Destino do "voltar" da barra superior do celular, definido pela tela aberta (useBackNavigation).
export function BackNavigationProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<IBackTarget | null>(null);
  const value = useMemo(() => ({ target, setTarget }), [target]);
  return <BackNavigationContext.Provider value={value}>{children}</BackNavigationContext.Provider>;
}
