import { act, renderHook, waitFor } from '@testing-library/react';
import type { IMesaContexto } from '@/@types/liveSheet';
import { useLiveSheet } from '@/hooks/useLiveSheet';
import { liveSheetService } from '@/services/liveSheetService';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/liveSheetService');
vi.mock('@/services/supabaseService', () => {
  const canal = { on: () => canal, subscribe: () => canal };
  return { supabase: { channel: () => canal, removeChannel: vi.fn() } };
});
vi.mock('@/utils/buzzer', () => ({ playBuzzer: vi.fn() }));

const contexto = (): IMesaContexto => ({
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
  jogadores: [{ id: 'a1', time_id: 'A', nome: 'Bebeto', apelido: null, numero: 7 }],
  mesa: {
    jogo_id: 'j1',
    competicao_id: 'c1',
    status: 'em_andamento',
    escalados: ['a1'],
    periodo: 1,
    relogio_restante_ms: 600_000,
    posse_restante_ms: 10_000,
    relogio_rodando: false,
    relogio_referencia_em: '2020-01-01T15:00:00Z',
    apontador: null,
    cronometrista: null,
    operador_24: null,
    arbitro: null,
    fiscal: null,
    aberta_por: null,
    created_at: '2026-11-01T15:00:00Z',
    encerrada_em: null,
  },
  lances: [],
});

beforeEach(() => {
  localStorage.clear();
  vi.mocked(liveSheetService.getContext).mockResolvedValue(contexto());
  vi.mocked(liveSheetService.serverTime).mockResolvedValue(Date.now());
  vi.mocked(liveSheetService.addLance).mockResolvedValue();
  vi.mocked(liveSheetService.clock).mockResolvedValue();
});

const montar = async () => {
  const hook = renderHook(() => useLiveSheet('c1', 'j1'), { wrapper: createQueryWrapper() });
  await waitFor(() => expect(hook.result.current.resumo).not.toBeNull());
  return hook;
};

describe('useLiveSheet', () => {
  it('sends a point, updates the score and resets the shot clock after a basket', async () => {
    const { result } = await montar();
    act(() => {
      result.current.lancar({ tipo: 'ponto', time_id: 'A', jogador_id: 'a1', valor: 2 });
    });
    expect(result.current.resumo?.placar).toEqual({ casa: 2, fora: 0 });
    expect(result.current.posseMs).toBe(24_000);
    await waitFor(() => expect(liveSheetService.addLance).toHaveBeenCalledWith(expect.objectContaining({ valor: 2, periodo: 1 })));
    expect(liveSheetService.clock).toHaveBeenCalled();
  });

  it('applies clock changes even when the device clock is behind the server', async () => {
    vi.mocked(liveSheetService.getContext).mockResolvedValue({
      ...contexto(),
      mesa: { ...contexto().mesa!, relogio_referencia_em: '2999-01-01T00:00:00Z' },
    });
    const { result } = await montar();
    act(() => result.current.definirPosse(14));
    expect(result.current.posseMs).toBe(14_000);
  });

  it('starts the clock and sends its state', async () => {
    const { result } = await montar();
    act(() => result.current.iniciar());
    expect(result.current.relogio?.rodando).toBe(true);
    await waitFor(() => expect(liveSheetService.clock).toHaveBeenCalledWith('j1', expect.objectContaining({ rodando: true })));
  });

  it('keeps plays in the queue while offline', async () => {
    vi.mocked(liveSheetService.addLance).mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = await montar();
    act(() => {
      result.current.lancar({ tipo: 'ponto', time_id: 'A', jogador_id: 'a1', valor: 1 });
    });
    await waitFor(() => expect(result.current.offline).toBe(true));
    expect(result.current.pendentes).toBe(1);
    expect(result.current.lances[0].pendente).toBe(true);
    expect(localStorage.getItem('mesa:j1')).toContain('"lance"');
  });

  it('refuses a third timeout in the first half', async () => {
    const { result } = await montar();
    let erro: string | null = null;
    act(() => {
      result.current.lancar({ tipo: 'tempo', time_id: 'A' });
      result.current.lancar({ tipo: 'tempo', time_id: 'A' });
    });
    act(() => {
      erro = result.current.lancar({ tipo: 'tempo', time_id: 'A' });
    });
    expect(erro).toBe('Esta equipe já usou todos os tempos desta parte do jogo.');
  });

  it('undoes the last play', async () => {
    const { result } = await montar();
    vi.mocked(liveSheetService.addLance).mockReturnValue(new Promise(() => undefined));
    act(() => {
      result.current.lancar({ tipo: 'ponto', time_id: 'A', jogador_id: 'a1', valor: 3 });
    });
    act(() => result.current.desfazer());
    expect(result.current.resumo?.placar.casa).toBe(0);
  });
});
