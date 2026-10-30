import { useCallback, useEffect, useState } from 'react';

export interface IShareData {
  title: string;
  text?: string;
  url?: string;
}

const COPIED_MS = 2500;

// Abre o menu de compartilhar do celular; sem ele (computador), copia o link.
export function useShare() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const share = useCallback(async ({ title, text, url = window.location.href }: IShareData) => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // Cancelado pela pessoa: nada a fazer.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt('Copie o link:', url);
    }
  }, []);

  return { share, copied };
}
