import { useContext } from 'react';
import { ConfirmContext, type IConfirmContext, type IConfirmOptions } from '@/providers/ConfirmProvider';

function useConfirmContext(): IConfirmContext {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm precisa estar dentro de <ConfirmProvider>.');
  return context;
}

export function useConfirm(): IConfirmContext['confirm'] {
  return useConfirmContext().confirm;
}

// Atalho para handlers: pergunta antes e só executa a ação se a pessoa confirmar.
export function useConfirmAction() {
  const { confirm, autoConfirm } = useConfirmContext();
  return (message: string, action: () => void, options: Omit<IConfirmOptions, 'message'> = {}) => {
    if (autoConfirm) {
      action();
      return;
    }
    void confirm({ ...options, message }).then((ok) => {
      if (ok) action();
    });
  };
}
