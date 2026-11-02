import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { IMesaContexto } from '@/@types/liveSheet';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { liveSheetService } from '@/services/liveSheetService';
import { supabase } from '@/services/supabaseService';
import { applyLiveChange, clockAt, clockFromMesa, summarizeLive, type ILiveChange } from '@/utils/liveSheet';
import { useServerClock } from './useServerClock';

const TICK_MS = 200;

// Jogo ao vivo para a torcida e para o telão (só leitura). As mudanças chegam pelo Realtime e são
// aplicadas direto na tela, sem consultar o banco de novo (economiza tráfego com muita gente assistindo).
export function useLiveGame(jogoId: string, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.liveGame(jogoId),
    queryFn: () => liveSheetService.getContext(jogoId),
    enabled,
  });
  const ctx = query.data;
  const agora = useServerClock();

  useEffect(() => {
    if (!enabled) return undefined;
    const chave = QUERY_KEYS.liveGame(jogoId);
    const aplicar = (tabela: ILiveChange['tabela']) => (payload: {
      eventType: ILiveChange['evento'];
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }) => {
      queryClient.setQueryData<IMesaContexto>(chave, (atual) =>
        atual
          ? applyLiveChange(atual, {
              tabela,
              evento: payload.eventType,
              novo: Object.keys(payload.new ?? {}).length ? payload.new : null,
              antigo: payload.old ?? null,
            })
          : atual,
      );
    };
    const canal = supabase
      .channel(`ao-vivo-${jogoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jogo_mesa', filter: `jogo_id=eq.${jogoId}` }, aplicar('jogo_mesa'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jogo_lances', filter: `jogo_id=eq.${jogoId}` }, aplicar('jogo_lances'))
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [jogoId, queryClient, enabled]);

  const mesa = ctx?.mesa ?? null;
  const relogio = useMemo(() => (mesa ? clockFromMesa(mesa) : null), [mesa]);

  // Com o relógio correndo, a tela atualiza sozinha.
  const [instante, setInstante] = useState(() => Date.now());
  useEffect(() => {
    if (!relogio?.rodando) return;
    const id = window.setInterval(() => setInstante(agora()), TICK_MS);
    return () => window.clearInterval(id);
  }, [relogio?.rodando, agora]);

  const valores = relogio ? clockAt(relogio, relogio.rodando ? Math.max(instante, relogio.referenciaMs) : relogio.referenciaMs) : null;
  const resumo = useMemo(
    () =>
      ctx && relogio
        ? summarizeLive(ctx.lances, relogio.periodo, ctx.competicao, { casa: ctx.casa.id, fora: ctx.fora.id })
        : null,
    [ctx, relogio],
  );

  return {
    ctx,
    isLoading: enabled && query.isPending,
    error: query.error,
    refetch: query.refetch,
    relogio,
    jogoMs: valores?.jogoMs ?? 0,
    posseMs: valores?.posseMs ?? null,
    resumo,
  };
}
