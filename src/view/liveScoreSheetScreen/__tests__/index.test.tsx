import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { IMesaContexto } from '@/@types/liveSheet';
import { useLiveSheet } from '@/hooks/useLiveSheet';
import { summarizeLive } from '@/utils/liveSheet';
import { renderScreen } from '@/utils/testUtils';
import { LiveScoreSheetScreen } from '..';

vi.mock('@/hooks/useLiveSheet');

const regras = {
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
};

const mesaBase = {
  jogo_id: 'j1',
  competicao_id: 'c1',
  status: 'em_andamento' as const,
  escalados: ['a1', 'b1'],
  periodo: 1,
  relogio_restante_ms: 600_000,
  posse_restante_ms: 24_000,
  relogio_rodando: false,
  relogio_referencia_em: '2026-11-01T15:00:00Z',
  apontador: null,
  cronometrista: null,
  operador_24: null,
  arbitro: null,
  fiscal: null,
  aberta_por: null,
  created_at: '2026-11-01T15:00:00Z',
  encerrada_em: null,
};

const contexto = (mesa: IMesaContexto['mesa']): IMesaContexto => ({
  jogo: { id: 'j1', competicao_id: 'c1', status: 'agendado', fase: 'Fase 1', empatePermitido: false },
  competicao: { nome: 'Liga', ...regras },
  casa: { id: 'A', nome: 'Okami BC', logo_url: null },
  fora: { id: 'B', nome: 'QuixaRocks', logo_url: null },
  jogadores: [
    { id: 'a1', time_id: 'A', nome: 'Bebeto', apelido: null, numero: 7 },
    { id: 'b1', time_id: 'B', nome: 'Daniel', apelido: null, numero: 4 },
  ],
  mesa,
  lances: [],
});

const mutation = () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null, isSuccess: false });

function mockMesa(mesa: IMesaContexto['mesa']) {
  const ctx = contexto(mesa);
  const value = {
    ctx,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    relogio: mesa ? { periodo: 1, restanteMs: 600_000, posseMs: 24_000, rodando: false, referenciaMs: 0 } : null,
    jogoMs: 600_000,
    posseMs: 24_000,
    aviso: null,
    fecharAviso: vi.fn(),
    lances: [],
    resumo: mesa ? summarizeLive([], 1, ctx.competicao, { casa: 'A', fora: 'B' }) : null,
    proximoPasso: 'proximo_periodo',
    pendentes: 0,
    offline: false,
    erroFila: null,
    limparErroFila: vi.fn(),
    iniciar: vi.fn(),
    pausar: vi.fn(),
    ajustarJogo: vi.fn(),
    definirPosse: vi.fn(),
    ajustarPosse: vi.fn(),
    proximoPeriodo: vi.fn(),
    lancar: vi.fn(() => null),
    anular: vi.fn(),
    desfazer: vi.fn(),
    podeDesfazer: false,
    abrir: mutation(),
    escalar: mutation(),
    encerrar: mutation(),
    descartar: mutation(),
  };
  vi.mocked(useLiveSheet).mockReturnValue(value as unknown as ReturnType<typeof useLiveSheet>);
  return value;
}

const render = () =>
  renderScreen(
    <Routes>
      <Route path="/c/:competitionId/j/:gameId" element={<LiveScoreSheetScreen />} />
    </Routes>,
    '/c/c1/j/j1',
  );

describe('LiveScoreSheetScreen', () => {
  it('opens the table for a game without a result', () => {
    const { abrir } = mockMesa(null);
    render();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir a mesa' }));
    expect(abrir.mutate).toHaveBeenCalled();
  });

  it('asks for the lineup before the game', () => {
    mockMesa({ ...mesaBase, escalados: [] });
    render();
    expect(screen.getByRole('button', { name: 'Começar o jogo' })).toBeInTheDocument();
    expect(screen.getByLabelText('#7 Bebeto')).toBeInTheDocument();
  });

  it('registers plays, starts the clock with the space bar and picks other fouls', () => {
    const mesa = mockMesa(mesaBase);
    render();
    expect(screen.getByText('Tudo salvo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2 pontos para #7 Bebeto' }));
    expect(mesa.lancar).toHaveBeenCalledWith({ tipo: 'ponto', time_id: 'A', jogador_id: 'a1', valor: 2 });
    fireEvent.keyDown(window, { code: 'Space' });
    expect(mesa.iniciar).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('radio', { name: 'QuixaRocks' }));
    fireEvent.click(screen.getByRole('button', { name: 'Outras faltas de #4 Daniel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Falta técnica' }));
    expect(mesa.lancar).toHaveBeenCalledWith({ tipo: 'falta', time_id: 'B', jogador_id: 'b1', tipo_falta: 'tecnica' });
  });

  it('confirms before closing the game', () => {
    const mesa = mockMesa(mesaBase);
    render();
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar o jogo' }));
    expect(screen.getByText(/O tempo de jogo ainda não terminou/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar' }));
    expect(mesa.encerrar.mutate).toHaveBeenCalled();
  });

  it('shows the closed table as read-only', () => {
    mockMesa({ ...mesaBase, status: 'encerrada' });
    render();
    expect(screen.getByText(/Jogo encerrado/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Iniciar' })).not.toBeInTheDocument();
  });
});
