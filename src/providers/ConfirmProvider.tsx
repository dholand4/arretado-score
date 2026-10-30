import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialogGlobal } from '@/components/confirmDialogGlobal';

export interface IConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export interface IConfirmContext {
  // Abre o diálogo e resolve true só se a pessoa confirmar.
  confirm: (options: IConfirmOptions) => Promise<boolean>;
  // Só nos testes: confirma tudo na hora, sem abrir o diálogo.
  autoConfirm: boolean;
}

export const ConfirmContext = createContext<IConfirmContext | null>(null);

// Um único diálogo de confirmação para o app todo: toda alteração passa por ele antes de salvar.
export function ConfirmProvider({ children, autoConfirm = false }: { children: ReactNode; autoConfirm?: boolean }) {
  const [options, setOptions] = useState<IConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback(
    (next: IConfirmOptions) =>
      autoConfirm
        ? Promise.resolve(true)
        : new Promise<boolean>((resolve) => {
            resolver.current?.(false);
            resolver.current = resolve;
            setOptions(next);
          }),
    [autoConfirm],
  );

  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  const value = useMemo(() => ({ confirm, autoConfirm }), [confirm, autoConfirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialogGlobal
        open={Boolean(options)}
        title={options?.title ?? 'Confirmar alteração'}
        message={options?.message ?? ''}
        confirmLabel={options?.confirmLabel ?? 'Confirmar'}
        danger={options?.danger}
        onConfirm={() => close(true)}
        onClose={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}
