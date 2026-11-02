import { useEffect } from 'react';

// Mantém a tela acesa enquanto `ativo` (mesa aberta, telão). Pede de novo ao voltar para o app.
export function useWakeLock(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !('wakeLock' in navigator)) return;
    let trava: WakeLockSentinel | null = null;
    const pedir = () => {
      navigator.wakeLock
        .request('screen')
        .then((t) => {
          trava = t;
        })
        .catch(() => undefined);
    };
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') pedir();
    };
    pedir();
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      document.removeEventListener('visibilitychange', aoVoltar);
      void trava?.release();
    };
  }, [ativo]);
}
