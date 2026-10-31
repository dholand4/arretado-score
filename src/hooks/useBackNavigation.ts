import { useContext, useEffect } from 'react';
import { BackNavigationContext, type IBackTarget } from '@/providers/BackNavigationProvider';

// A tela diz para onde o "‹" da barra superior volta; ao sair da tela, o botão some.
// Fora do painel (ex.: testes da tela isolada) não faz nada.
export function useBackNavigation({ to, label }: IBackTarget) {
  const setTarget = useContext(BackNavigationContext)?.setTarget;
  useEffect(() => {
    if (!setTarget) return undefined;
    setTarget({ to, label });
    return () => setTarget(null);
  }, [setTarget, to, label]);
}

export function useBackTarget(): IBackTarget | null {
  return useContext(BackNavigationContext)?.target ?? null;
}
