import { act, renderHook, waitFor } from '@testing-library/react';
import type { IMesaContexto } from '@/@types/liveSheet';
import { useLiveGame } from '@/hooks/useLiveGame';
import { liveSheetService } from '@/services/liveSheetService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/liveSheetService');
type Handler = (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void;
const handlers: Record<string, Handler> = {};
vi.mock('@/services/supabaseService', () => {
  const canal = {
    on: (_tipo: string, filtro: { table: string }, fn: Handler) => {
      handlers[filtro.table] = fn;
      return canal;
    },
    subscribe: () => canal,
  };
  return { supabase: { channel: () => canal, removeChannel: vi.fn() } };
});

const contexto = (): IMesaContexto =>
  ({
    jogo: { id: 'j1', competicao_id: 'c1', status: 'agendado', fase: 'Fase 1', empatePermitido: false },
    competicao: {
      nome: 'Liga',
      qtd_periodos: 4,
      duracao_periodo_min: 10,
      duracao_prorrogacao_min: 5,
      faltas_bonus_equipe: 4,
      faltas_exclusao_jogador: 5,
      tempos_primeira_metade: 2,
      tempos_segunda_metade: 3,
      tempos_prorrogacao: 1,
      relogio_posse: true,
      posse_segundos: 24,
      posse_reset_curto: 14,
    },
    casa: { id: 'A', nome: 'Okami BC', logo_url: null },
    fora: { id: 'B', nome: 'QuixaRocks', logo_url: null },
    jogadores: [],
    mesa: {
      jogo_id: 'j1',
      competicao_id: 'c1',
      status: 'em_andamento',
      escalados: [],
      periodo: 1,
      relogio_restante_ms: 600_000,
      posse_restante_ms: 24_000,
      relogio_rodando: false,
      relogio_referencia_em: '2026-11-01T15:00:00Z',
    },
    lances: [],
  }) as unknown as IMesaContexto;

beforeEach(() => {
  vi.mocked(liveSheetService.getContext).mockResolvedValue(contexto());
  vi.mocked(liveSheetService.serverTime).mockResolvedValue(Date.now());
});

describe('useLiveGame', () => {
  it('applies plays from realtime without querying the database again', async () => {
    const { result } = renderHook(() => useLiveGame('j1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.resumo).not.toBeNull());
    act(() => {
      handlers.jogo_lances({
        eventType: 'INSERT',
        new: { id: 'l1', jogo_id: 'j1', periodo: 1, tempo_restante_ms: 500_000, tipo: 'ponto', time_id: 'B', jogador_id: 'b1', valor: 3, tipo_falta: null, anulado: false },
        old: {},
      });
    });
    await waitFor(() => expect(result.current.resumo?.placar).toEqual({ casa: 0, fora: 3 }));
    act(() => {
      handlers.jogo_mesa({ eventType: 'UPDATE', new: { ...contexto().mesa, periodo: 2 }, old: {} });
    });
    await waitFor(() => expect(result.current.relogio?.periodo).toBe(2));
    expect(liveSheetService.getContext).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a game that already has a result', () => {
    const { result } = renderHook(() => useLiveGame('j1', false), { wrapper: createQueryWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(liveSheetService.getContext).not.toHaveBeenCalled();
  });
});
