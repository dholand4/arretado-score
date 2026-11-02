import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ILance, INovoLance, IOficiaisMesa, IOperacaoMesa, IRelogio } from '@/@types/liveSheet';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { liveSheetService } from '@/services/liveSheetService';
import { supabase } from '@/services/supabaseService';
import { getErrorMessage, isNetworkError } from '@/utils/appError';
import { playBuzzer } from '@/utils/buzzer';
import {
  clockAt,
  mergeLances,
  nextStep,
  periodDurationMs,
  snapshotClock,
  summarizeLive,
  unseenConfirmations,
} from '@/utils/liveSheet';

export type AvisoMesa = 'fim_periodo' | 'posse' | null;

const TICK_MS = 100;
const RETRY_MS = 4000;

// Fila guardada no aparelho: sobrevive a recarregar a página sem internet.
const storageKey = (jogoId: string) => `mesa:${jogoId}`;

function readQueue(jogoId: string): IOperacaoMesa[] {
  try {
    const raw = localStorage.getItem(storageKey(jogoId));
    return raw ? (JSON.parse(raw) as IOperacaoMesa[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(jogoId: string, fila: IOperacaoMesa[]) {
  try {
    if (fila.length) localStorage.setItem(storageKey(jogoId), JSON.stringify(fila));
    else localStorage.removeItem(storageKey(jogoId));
  } catch {
    // Armazenamento indisponível: a fila segue só na memória.
  }
}

function lastClock(fila: IOperacaoMesa[]): IRelogio | null {
  const op = [...fila].reverse().find((o) => o.tipo === 'relogio');
  return op?.tipo === 'relogio' ? op.relogio : null;
}

// Súmula ao vivo (seção 6.5.1): relógios na hora do servidor, lances com fila offline e
// sincronização com outros aparelhos pelo Realtime.
export function useLiveSheet(competicaoId: string, jogoId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEYS.liveSheet(jogoId), queryFn: () => liveSheetService.getContext(jogoId) });
  const ctx = query.data;

  // Diferença entre a hora do servidor e a do aparelho, para todos verem o mesmo relógio.
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
  const agora = useCallback(() => Date.now() + offsetRef.current, []);

  // ---- Fila do aparelho -------------------------------------------------------------------
  const [fila, setFila] = useState<IOperacaoMesa[]>(() => readQueue(jogoId));
  const filaRef = useRef(fila);
  const enviando = useRef(false);
  const emEnvio = useRef<IOperacaoMesa | null>(null);
  const [offline, setOffline] = useState(false);
  const [erroFila, setErroFila] = useState<string | null>(null);
  // Já aceitos pelo servidor, mas a consulta ainda não trouxe: continuam na tela até aparecerem.
  const [confirmados, setConfirmados] = useState<IOperacaoMesa[]>([]);
  const lancesServidorRef = useRef<ILance[]>([]);

  const salvarFila = useCallback(
    (proxima: IOperacaoMesa[]) => {
      filaRef.current = proxima;
      writeQueue(jogoId, proxima);
      setFila(proxima);
    },
    [jogoId],
  );

  const enviar = useCallback(async () => {
    if (enviando.current) return;
    enviando.current = true;
    try {
      while (filaRef.current.length > 0) {
        const op = filaRef.current[0];
        emEnvio.current = op;
        try {
          if (op.tipo === 'lance') await liveSheetService.addLance(op.lance);
          else if (op.tipo === 'anular') await liveSheetService.voidLance(op.lanceId);
          else await liveSheetService.clock(jogoId, op.relogio);
          setOffline(false);
          // Guarda o aceito e descarta os que a consulta já trouxe.
          if (op.tipo !== 'relogio') {
            setConfirmados((atual) => [...unseenConfirmations(lancesServidorRef.current, atual), op]);
          }
        } catch (err) {
          if (isNetworkError(err)) {
            setOffline(true);
            return;
          }
          // Recusado pelo servidor (regra): descarta para não travar a fila e avisa.
          setErroFila(getErrorMessage(err));
        }
        salvarFila(filaRef.current.filter((o) => o !== op));
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.liveSheet(jogoId) });
    } finally {
      emEnvio.current = null;
      enviando.current = false;
    }
  }, [jogoId, queryClient, salvarFila]);

  const enfileirar = useCallback(
    (op: IOperacaoMesa) => {
      // Do relógio só importa o estado mais novo.
      const base = op.tipo === 'relogio' ? filaRef.current.filter((o) => o.tipo !== 'relogio') : filaRef.current;
      salvarFila([...base, op]);
      void enviar();
    },
    [enviar, salvarFila],
  );

  useEffect(() => {
    void enviar();
    const online = () => void enviar();
    window.addEventListener('online', online);
    const id = window.setInterval(() => {
      if (filaRef.current.length) void enviar();
    }, RETRY_MS);
    return () => {
      window.removeEventListener('online', online);
      window.clearInterval(id);
    };
  }, [enviar]);

  // ---- Relógios -----------------------------------------------------------------------------
  const mesa = ctx?.mesa ?? null;
  const relogioServidor = useMemo<IRelogio | null>(
    () =>
      mesa && {
        periodo: mesa.periodo,
        restanteMs: mesa.relogio_restante_ms,
        posseMs: mesa.posse_restante_ms,
        rodando: mesa.relogio_rodando,
        referenciaMs: new Date(mesa.relogio_referencia_em).getTime(),
      },
    [mesa],
  );
  // Estado mexido neste aparelho (começa pelo que ficou na fila). Vale o mais novo entre ele e o
  // do servidor: assim outro aparelho na mesma mesa também move o relógio daqui.
  const [relogioLocal, setRelogioLocal] = useState<IRelogio | null>(() => lastClock(readQueue(jogoId)));
  const relogio =
    relogioServidor && (!relogioLocal || relogioServidor.referenciaMs > relogioLocal.referenciaMs)
      ? relogioServidor
      : relogioServidor && relogioLocal;
  const relogioRef = useRef(relogio);
  useEffect(() => {
    relogioRef.current = relogio;
  }, [relogio]);

  const mudarRelogio = useCallback(
    (mudar: (atual: IRelogio) => IRelogio) => {
      const atual = relogioRef.current;
      if (!atual) return;
      // Sempre depois da última referência: um aparelho com relógio atrasado (ou que ainda não
      // sabe a hora do servidor) não pode ter a mudança ignorada como "estado antigo".
      const instante = Math.max(agora(), atual.referenciaMs + 1);
      const proximo = { ...mudar(snapshotClock(atual, instante)), referenciaMs: instante };
      relogioRef.current = proximo;
      setRelogioLocal(proximo);
      enfileirar({ tipo: 'relogio', relogio: proximo });
    },
    [agora, enfileirar],
  );

  const [instante, setInstante] = useState(() => Date.now());
  const [aviso, setAviso] = useState<AvisoMesa>(null);

  // Enquanto roda: atualiza a tela e para sozinho no fim do período ou no estouro da posse.
  useEffect(() => {
    if (!relogio?.rodando) return;
    const id = window.setInterval(() => {
      const t = agora();
      setInstante(t);
      const atual = relogioRef.current;
      if (!atual?.rodando) return;
      const { jogoMs, posseMs } = clockAt(atual, t);
      if (jogoMs <= 0) {
        mudarRelogio((s) => ({ ...s, restanteMs: 0, rodando: false }));
        setAviso('fim_periodo');
        playBuzzer();
      } else if (posseMs !== null && posseMs <= 0) {
        mudarRelogio((s) => ({ ...s, posseMs: 0, rodando: false }));
        setAviso('posse');
        playBuzzer();
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [relogio?.rodando, agora, mudarRelogio]);

  const valores = relogio ? clockAt(relogio, relogio.rodando ? instante : relogio.referenciaMs) : null;
  const regras = ctx?.competicao;
  const posseCheia = regras?.relogio_posse ? regras.posse_segundos * 1000 : null;

  const iniciar = useCallback(() => {
    mudarRelogio((s) => {
      if (s.restanteMs <= 0) return s;
      // Posse estourada volta cheia ao reiniciar.
      const posseMs = s.posseMs !== null && s.posseMs <= 0 ? posseCheia : s.posseMs;
      return { ...s, posseMs, rodando: true };
    });
    setAviso(null);
  }, [mudarRelogio, posseCheia]);

  const pausar = useCallback(() => mudarRelogio((s) => ({ ...s, rodando: false })), [mudarRelogio]);

  const ajustarJogo = useCallback(
    (deltaMs: number) => {
      if (!regras) return;
      mudarRelogio((s) => ({
        ...s,
        restanteMs: Math.min(periodDurationMs(s.periodo, regras), Math.max(0, s.restanteMs + deltaMs)),
      }));
    },
    [mudarRelogio, regras],
  );

  const definirPosse = useCallback(
    (segundos: number) => {
      if (posseCheia === null) return;
      mudarRelogio((s) => ({ ...s, posseMs: segundos * 1000 }));
      setAviso((a) => (a === 'posse' ? null : a));
    },
    [mudarRelogio, posseCheia],
  );

  const ajustarPosse = useCallback(
    (deltaMs: number) => {
      if (posseCheia === null) return;
      mudarRelogio((s) => ({ ...s, posseMs: Math.min(posseCheia, Math.max(0, (s.posseMs ?? 0) + deltaMs)) }));
    },
    [mudarRelogio, posseCheia],
  );

  // ---- Lances e resumo ----------------------------------------------------------------------
  const lancesServidor = ctx?.lances;
  useEffect(() => {
    lancesServidorRef.current = lancesServidor ?? [];
  }, [lancesServidor]);

  // Tela = servidor + confirmados que ainda não voltaram na consulta + fila do aparelho.
  const lances: ILance[] = useMemo(() => {
    const servidor = lancesServidor ?? [];
    const aindaNaoVieram = unseenConfirmations(servidor, confirmados);
    return mergeLances(
      [...servidor, ...aindaNaoVieram.flatMap((o) => (o.tipo === 'lance' ? [o.lance] : []))],
      fila.flatMap((o) => (o.tipo === 'lance' ? [o.lance] : [])),
      [...aindaNaoVieram, ...fila].flatMap((o) => (o.tipo === 'anular' ? [o.lanceId] : [])),
    );
  }, [lancesServidor, confirmados, fila]);

  const resumo = useMemo(
    () =>
      ctx && relogio
        ? summarizeLive(lances, relogio.periodo, ctx.competicao, { casa: ctx.casa.id, fora: ctx.fora.id })
        : null,
    [ctx, lances, relogio],
  );

  const proximoPasso =
    ctx && relogio && resumo ? nextStep(relogio.periodo, ctx.competicao, resumo.placar, ctx.jogo.empatePermitido) : null;

  // Devolve a mensagem quando o lance não pode ser feito.
  const lancar = useCallback(
    (novo: INovoLance): string | null => {
      const atual = relogioRef.current;
      if (!ctx || !atual || !resumo) return null;
      if (novo.jogador_id && resumo.jogadores[novo.jogador_id]?.excluido) return 'Jogador excluído do jogo.';
      const lado = novo.time_id === ctx.casa.id ? 'casa' : 'fora';
      if (novo.tipo === 'tempo' && resumo.temposUsados[lado] >= resumo.temposLimite) {
        return 'Esta equipe já usou todos os tempos desta parte do jogo.';
      }
      const lance: ILance = {
        id: crypto.randomUUID(),
        jogo_id: jogoId,
        periodo: atual.periodo,
        tempo_restante_ms: Math.round(clockAt(atual, agora()).jogoMs),
        tipo: novo.tipo,
        time_id: novo.time_id,
        jogador_id: novo.tipo === 'tempo' ? null : (novo.jogador_id ?? null),
        valor: novo.tipo === 'ponto' ? (novo.valor ?? null) : null,
        tipo_falta: novo.tipo === 'falta' ? (novo.tipo_falta ?? 'pessoal') : null,
        anulado: false,
      };
      enfileirar({ tipo: 'lance', lance });
      // Falta e tempo param o jogo; cesta de quadra troca a posse.
      if (novo.tipo !== 'ponto') {
        if (atual.rodando) pausar();
      } else if ((novo.valor ?? 0) >= 2 && posseCheia !== null) {
        mudarRelogio((s) => ({ ...s, posseMs: posseCheia }));
      }
      return null;
    },
    [ctx, resumo, jogoId, agora, enfileirar, pausar, mudarRelogio, posseCheia],
  );

  const anular = useCallback(
    (lanceId: string) => {
      // Ainda na fila e não saiu: basta tirar. Já no servidor (ou a caminho): anula depois dele, em ordem.
      const naFila = filaRef.current.find((o) => o.tipo === 'lance' && o.lance.id === lanceId);
      if (naFila && naFila !== emEnvio.current) salvarFila(filaRef.current.filter((o) => o !== naFila));
      else enfileirar({ tipo: 'anular', lanceId });
    },
    [enfileirar, salvarFila],
  );

  const ultimoValido = [...lances].reverse().find((l) => !l.anulado) ?? null;
  const desfazer = useCallback(() => {
    if (ultimoValido) anular(ultimoValido.id);
  }, [anular, ultimoValido]);

  const proximoPeriodo = useCallback(() => {
    if (!regras || proximoPasso === 'fim') return;
    mudarRelogio((s) => ({
      ...s,
      periodo: s.periodo + 1,
      restanteMs: periodDurationMs(s.periodo + 1, regras),
      posseMs: posseCheia,
      rodando: false,
    }));
    setAviso(null);
  }, [mudarRelogio, posseCheia, proximoPasso, regras]);

  // ---- Abrir, escalar, encerrar e descartar ----------------------------------------------
  const recarregar = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.liveSheet(jogoId) });

  const abrir = useMutation({ mutationFn: () => liveSheetService.open(jogoId), onSuccess: recarregar });

  const escalar = useMutation({
    mutationFn: ({ escalados, oficiais }: { escalados: string[]; oficiais: IOficiaisMesa }) =>
      liveSheetService.lineup(jogoId, escalados, oficiais),
    onSuccess: recarregar,
  });

  const encerrar = useMutation({
    mutationFn: async () => {
      if (filaRef.current.length) await enviar();
      if (filaRef.current.length) throw new Error('Ainda há lances sem enviar. Aguarde a conexão voltar.');
      await liveSheetService.close(jogoId);
    },
    onSuccess: () => {
      for (const key of [
        QUERY_KEYS.liveSheet(jogoId),
        QUERY_KEYS.scoreSheet(jogoId),
        QUERY_KEYS.games(competicaoId),
        QUERY_KEYS.classificationAll,
        QUERY_KEYS.events(competicaoId),
        QUERY_KEYS.gamesProgress(competicaoId),
        QUERY_KEYS.phases(competicaoId),
        QUERY_KEYS.competition(competicaoId),
      ]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });

  const descartar = useMutation({
    mutationFn: () => liveSheetService.discard(jogoId),
    onSuccess: () => {
      salvarFila([]);
      setConfirmados([]);
      void recarregar();
    },
  });

  // Outro aparelho na mesma mesa: recarrega quando mudam lances ou relógio.
  useEffect(() => {
    const canal = supabase
      .channel(`mesa-${jogoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jogo_lances', filter: `jogo_id=eq.${jogoId}` }, () => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.liveSheet(jogoId) });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jogo_mesa', filter: `jogo_id=eq.${jogoId}` }, () => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.liveSheet(jogoId) });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [jogoId, queryClient]);

  // Tela sempre acesa enquanto a mesa está aberta.
  const emAndamento = mesa?.status === 'em_andamento';
  useEffect(() => {
    if (!emAndamento || !('wakeLock' in navigator)) return;
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
  }, [emAndamento]);

  return {
    ctx,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    relogio,
    jogoMs: valores?.jogoMs ?? 0,
    posseMs: valores?.posseMs ?? null,
    aviso,
    fecharAviso: () => setAviso(null),
    lances,
    resumo,
    proximoPasso,
    pendentes: fila.length,
    offline,
    erroFila,
    limparErroFila: () => setErroFila(null),
    iniciar,
    pausar,
    ajustarJogo,
    definirPosse,
    ajustarPosse,
    proximoPeriodo,
    lancar,
    anular,
    desfazer,
    podeDesfazer: Boolean(ultimoValido),
    abrir,
    escalar,
    encerrar,
    descartar,
  };
}
