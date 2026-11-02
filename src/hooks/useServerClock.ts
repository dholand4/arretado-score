import { useCallback, useEffect, useRef } from 'react';
import { liveSheetService } from '@/services/liveSheetService';

// Hora do servidor: a diferença para a do aparelho é medida uma vez, e todos veem o mesmo relógio.
export function useServerClock() {
  const offsetRef = useRef(0);
  useEffect(() => {
    let ativo = true;
    const inicio = Date.now();
    liveSheetService
      .serverTime()
      .then((servidor) => {
        if (ativo) offsetRef.current = servidor - (inicio + Date.now()) / 2;
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);
  return useCallback(() => Date.now() + offsetRef.current, []);
}
