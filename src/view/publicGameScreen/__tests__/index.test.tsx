import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { IMesaContexto } from '@/@types/liveSheet';
import type { IPublicGameDetail } from '@/@types/public';
import { useLiveGame } from '@/hooks/useLiveGame';
import { usePublicGame, usePublicPlayLog } from '@/hooks/usePublic';
import { renderScreen } from '@/utils/testUtils';
import { PublicGameScreen } from '..';

vi.mock('@/hooks/usePublic');
vi.mock('@/hooks/useLiveGame');

const pontos = { id: 'pts', nome: 'Pontos', sigla: 'PTS', titulo_ranking: 'Cestinha', soma_no_placar: true };

const detalhe = (patch: Record<string, unknown> = {}) =>
  ({
    jogo: {
      id: 'j1',
      competicao_id: 'c1',
      status: 'encerrado',
      so_placar: false,
      time_casa_id: 'A',
      time_fora_id: 'B',
      casa: { nome: 'Okami BC', sigla: 'OKA' },
      fora: { nome: 'QuixaRocks', sigla: 'QXR' },
      placar_casa: 5,
      placar_fora: 3,
      fase: { nome: 'Fase 1' },
      grupo: null,
      serie: null,
      numero_na_serie: null,
      inicio_previsto: '2026-11-07T22:00:00Z',
      evento: { data: '2026-11-07', local: 'Ginásio', status: 'publicado' },
      ...patch,
    },
    categorias: [pontos],
    jogadores: [{ id: 'a1', time_id: 'A', nome: 'Bebeto', apelido: null, numero: 7, foto_url: null }],
    presentes: ['a1'],
    estatisticas: { a1: { pts: 5 } },
  }) as unknown as IPublicGameDetail;

const lance = (id: string, timeId: string, valor: number, periodo: number, anulado = false) => ({
  id,
  jogo_id: 'j1',
  periodo,
  tempo_restante_ms: 300_000,
  tipo: 'ponto',
  time_id: timeId,
  jogador_id: timeId === 'A' ? 'a1' : null,
  valor,
  tipo_falta: null,
  anulado,
});

const mesa = (lances: ReturnType<typeof lance>[]) =>
  ({
    jogo: { id: 'j1', competicao_id: 'c1', status: 'encerrado', fase: 'Fase 1', empatePermitido: false },
    competicao: { nome: 'Liga', qtd_periodos: 4, faltas_bonus_equipe: 4, faltas_exclusao_jogador: 5 },
    casa: { id: 'A', nome: 'Okami BC', logo_url: null },
    fora: { id: 'B', nome: 'QuixaRocks', logo_url: null },
    jogadores: [{ id: 'a1', time_id: 'A', nome: 'Bebeto', apelido: null, numero: 7 }],
    mesa: { jogo_id: 'j1', status: 'encerrada', periodo: 4 },
    lances,
  }) as unknown as IMesaContexto;

function setup(jogo: IPublicGameDetail, historico: IMesaContexto | undefined) {
  vi.mocked(usePublicGame).mockReturnValue({ detalhe: jogo, isLoading: false, error: null, refetch: vi.fn() } as unknown as ReturnType<
    typeof usePublicGame
  >);
  vi.mocked(usePublicPlayLog).mockReturnValue({ mesa: historico, isLoading: false, error: null });
  vi.mocked(useLiveGame).mockReturnValue({ ctx: undefined, relogio: null, resumo: null, jogoMs: 0, posseMs: null } as unknown as ReturnType<
    typeof useLiveGame
  >);
  renderScreen(
    <Routes>
      <Route path="/c/:slug/jogos/:gameId" element={<PublicGameScreen />} />
    </Routes>,
    '/c/liga/jogos/j1',
  );
}

describe('PublicGameScreen', () => {
  it('keeps the play-by-play of a game finished at the table, below the box score', () => {
    setup(detalhe(), mesa([lance('l1', 'A', 2, 1), lance('x', 'A', 3, 1, true), lance('l2', 'B', 3, 2), lance('l3', 'A', 3, 2)]));
    expect(usePublicPlayLog).toHaveBeenCalledWith('j1', true);
    expect(useLiveGame).toHaveBeenCalledWith('j1', false);
    expect(screen.getByRole('link', { name: 'Bebeto' })).toHaveAttribute('href', '/c/liga/jogadores/a1');

    expect(screen.getByRole('heading', { name: 'Lance a lance' })).toBeInTheDocument();
    const lances = within(screen.getByRole('list', { name: 'Lances' })).getAllByRole('listitem');
    // Só os que valeram, do mais recente para o mais antigo.
    expect(lances.map((l) => l.textContent)).toEqual(['2º 05:00+3 #7 Bebeto', '2º 05:00+3 QuixaRocks', '1º 05:00+2 #7 Bebeto']);
    expect(screen.getByRole('radio', { name: '2º' })).toBeInTheDocument();
    expect(screen.queryByText(/placar foi corrigido/)).not.toBeInTheDocument();
  });

  it('warns when the score sheet was corrected after the game', () => {
    setup(detalhe({ placar_casa: 7 }), mesa([lance('l1', 'A', 2, 1), lance('l2', 'B', 3, 1), lance('l3', 'A', 3, 1)]));
    expect(screen.getByText(/placar foi corrigido na súmula depois do jogo/)).toBeInTheDocument();
  });

  it('shows no play-by-play for a game entered only through the score sheet', () => {
    setup(detalhe(), mesa([]));
    expect(screen.getByRole('region', { name: 'Estatísticas de Okami BC' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lance a lance' })).not.toBeInTheDocument();
  });

  it('does not load the finished log while the game has no result', () => {
    // Mesmo que os lances do jogo ao vivo estejam no cache, a seção do jogo encerrado não aparece.
    setup(detalhe({ status: 'agendado', placar_casa: null, placar_fora: null }), mesa([lance('l1', 'A', 2, 1)]));
    expect(screen.queryByRole('heading', { name: 'Lance a lance' })).not.toBeInTheDocument();
    expect(usePublicPlayLog).toHaveBeenCalledWith('j1', false);
    expect(useLiveGame).toHaveBeenCalledWith('j1', true);
    expect(screen.getByText('O placar aparece aqui assim que o jogo terminar.')).toBeInTheDocument();
  });
});
