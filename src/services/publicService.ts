import type { IJogoLista } from '@/@types/game';
import type {
  IPublicCompetition,
  IPublicGameDetail,
  IPublicPlayerDetail,
  IPublicPlayerGame,
  IPublicPlayerProfile,
  IPublicTeam,
  IPublicTeamSummary,
  IRankingData,
} from '@/@types/public';
import { AppError } from '@/utils/appError';
import { GAME_LIST_SELECT } from './gamesService';
import { supabase } from './supabaseService';

const PLAYER_FIELDS = 'id, time_id, nome, apelido, numero, foto_url';
const CATEGORY_FIELDS = 'id, nome, sigla, titulo_ranking, soma_no_placar';

// Tudo aqui passa pela RLS do visitante: só competição publicada, jogos de dias
// publicados ou já decididos e súmula de jogo encerrado (seção 10.2).
export const publicService = {
  async getCompetition(slug: string): Promise<IPublicCompetition> {
    const { data, error } = await supabase
      .from('competicoes')
      .select('id, nome, slug, logo_url, descricao, local_padrao, permite_empate, modalidade, status')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError('Competição não encontrada.');
    return data as IPublicCompetition;
  },

  async listGames(competicaoId: string): Promise<IJogoLista[]> {
    const { data, error } = await supabase
      .from('jogos')
      .select(GAME_LIST_SELECT)
      .eq('competicao_id', competicaoId)
      .neq('status', 'cancelado')
      .order('inicio_previsto', { nullsFirst: false })
      .order('numero_na_serie');
    if (error) throw error;
    return data as unknown as IJogoLista[];
  },

  async getGame(jogoId: string): Promise<IPublicGameDetail> {
    const { data: jogo, error } = await supabase.from('jogos').select(GAME_LIST_SELECT).eq('id', jogoId).maybeSingle();
    if (error) throw error;
    if (!jogo) throw new AppError('Jogo não encontrado.');
    const lista = jogo as unknown as IJogoLista;

    const [categorias, jogadores, presencas, estatisticas] = await Promise.all([
      supabase
        .from('categorias_estatistica')
        .select(CATEGORY_FIELDS)
        .eq('competicao_id', lista.competicao_id)
        .eq('ativa', true)
        .order('ordem'),
      supabase.from('jogadores').select(PLAYER_FIELDS).in('time_id', [lista.time_casa_id, lista.time_fora_id]),
      supabase.from('jogo_jogadores').select('jogador_id').eq('jogo_id', jogoId),
      supabase.from('sumula_estatisticas').select('jogador_id, categoria_id, valor').eq('jogo_id', jogoId),
    ]);
    for (const r of [categorias, jogadores, presencas, estatisticas]) if (r.error) throw r.error;

    const porJogador: IPublicGameDetail['estatisticas'] = {};
    for (const e of estatisticas.data ?? []) {
      porJogador[e.jogador_id] = { ...porJogador[e.jogador_id], [e.categoria_id]: e.valor };
    }
    return {
      jogo: lista,
      categorias: categorias.data ?? [],
      jogadores: jogadores.data ?? [],
      presentes: (presencas.data ?? []).map((p) => p.jogador_id),
      estatisticas: porJogador,
    };
  },

  // Rankings por categoria (seção 6.7); faseId nulo = competição inteira.
  async getRanking(competicaoId: string, faseId: string | null): Promise<IRankingData> {
    let ranking = supabase.from('v_ranking_estatisticas').select('*').eq('competicao_id', competicaoId);
    ranking = faseId ? ranking.eq('fase_id', faseId) : ranking.eq('escopo', 'competicao');

    const [linhas, categorias, jogadores, times, fases] = await Promise.all([
      ranking,
      supabase
        .from('categorias_estatistica')
        .select(CATEGORY_FIELDS)
        .eq('competicao_id', competicaoId)
        .eq('ativa', true)
        .order('ordem'),
      supabase.from('jogadores').select(PLAYER_FIELDS).eq('competicao_id', competicaoId),
      supabase.from('times').select('id, nome').eq('competicao_id', competicaoId),
      supabase.from('fases').select('id, nome').eq('competicao_id', competicaoId).order('ordem'),
    ]);
    for (const r of [linhas, categorias, jogadores, times, fases]) if (r.error) throw r.error;

    const jogadorPorId = new Map((jogadores.data ?? []).map((j) => [j.id, j]));
    const timePorId = new Map((times.data ?? []).map((t) => [t.id, t.nome]));
    return {
      categorias: categorias.data ?? [],
      fases: fases.data ?? [],
      linhas: (linhas.data ?? []).map((l) => ({
        categoria_id: l.categoria_id as string,
        jogador_id: l.jogador_id as string,
        time_id: l.time_id as string,
        total: l.total ?? 0,
        jogos: l.jogos ?? 0,
        media: Number(l.media ?? 0),
        jogador: jogadorPorId.get(l.jogador_id as string) ?? null,
        timeNome: timePorId.get(l.time_id as string) ?? '',
      })),
    };
  },

  // Página do jogador (seção 6.7.1): números iguais aos do ranking e o jogo a jogo.
  async getPlayer(jogadorId: string): Promise<IPublicPlayerDetail> {
    const { data, error } = await supabase
      .from('jogadores')
      .select(`${PLAYER_FIELDS}, competicao_id, posicao, ativo`)
      .eq('id', jogadorId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError('Jogador não encontrado.');
    const jogador = data as unknown as IPublicPlayerProfile;

    const [time, categorias, ranking, presencas, estatisticas] = await Promise.all([
      supabase.from('times').select('id, nome, sigla, logo_url').eq('id', jogador.time_id).maybeSingle(),
      supabase
        .from('categorias_estatistica')
        .select(CATEGORY_FIELDS)
        .eq('competicao_id', jogador.competicao_id)
        .eq('ativa', true)
        .order('ordem'),
      supabase
        .from('v_ranking_estatisticas')
        .select('categoria_id, total, jogos')
        .eq('jogador_id', jogadorId)
        .eq('escopo', 'competicao'),
      supabase.from('jogo_jogadores').select('jogo_id, time_id').eq('jogador_id', jogadorId),
      supabase.from('sumula_estatisticas').select('jogo_id, categoria_id, valor').eq('jogador_id', jogadorId),
    ]);
    for (const r of [time, categorias, ranking, presencas, estatisticas]) if (r.error) throw r.error;

    const timePorJogo = new Map((presencas.data ?? []).map((p) => [p.jogo_id, p.time_id]));
    let jogos: IJogoLista[] = [];
    if (timePorJogo.size > 0) {
      const lista = await supabase.from('jogos').select(GAME_LIST_SELECT).in('id', [...timePorJogo.keys()]);
      if (lista.error) throw lista.error;
      jogos = lista.data as unknown as IJogoLista[];
    }

    const valoresPorJogo = new Map<string, Record<string, number>>();
    for (const e of estatisticas.data ?? []) {
      valoresPorJogo.set(e.jogo_id, { ...valoresPorJogo.get(e.jogo_id), [e.categoria_id]: e.valor });
    }
    // Só jogo encerrado com súmula completa, como nos rankings (seção 6.7).
    const jogoAJogo: IPublicPlayerGame[] = jogos
      .filter((jogo) => jogo.status === 'encerrado' && !jogo.so_placar)
      .map((jogo) => ({
        jogo,
        time_id: timePorJogo.get(jogo.id) ?? jogador.time_id,
        valores: valoresPorJogo.get(jogo.id) ?? {},
      }));

    // A view traz uma linha por time em que o jogador atuou: soma para ter o total dele.
    const numeros = (categorias.data ?? []).map((categoria) => {
      const linhas = (ranking.data ?? []).filter((r) => r.categoria_id === categoria.id);
      const total = linhas.reduce((soma, r) => soma + (r.total ?? 0), 0);
      const disputados = linhas.reduce((soma, r) => soma + (r.jogos ?? 0), 0);
      return { categoria, total, jogos: disputados, media: disputados > 0 ? total / disputados : 0 };
    });

    return {
      jogador,
      time: time.data,
      jogosDisputados: Math.max(0, ...numeros.map((n) => n.jogos)),
      numeros,
      jogos: jogoAJogo,
    };
  },

  async listTeams(competicaoId: string): Promise<IPublicTeamSummary[]> {
    const { data, error } = await supabase
      .from('times')
      .select('id, nome, sigla, logo_url, jogadores(count)')
      .eq('competicao_id', competicaoId)
      .order('nome');
    if (error) throw error;
    return data as unknown as IPublicTeamSummary[];
  },

  async getTeam(timeId: string): Promise<IPublicTeam> {
    const { data: time, error } = await supabase
      .from('times')
      .select('id, nome, sigla, logo_url, competicao_id')
      .eq('id', timeId)
      .maybeSingle();
    if (error) throw error;
    if (!time) throw new AppError('Time não encontrado.');

    const [jogadores, categorias, ranking] = await Promise.all([
      supabase.from('jogadores').select(PLAYER_FIELDS).eq('time_id', timeId).eq('ativo', true).order('numero', { nullsFirst: false }),
      supabase
        .from('categorias_estatistica')
        .select(CATEGORY_FIELDS)
        .eq('competicao_id', time.competicao_id)
        .eq('ativa', true)
        .order('ordem'),
      supabase
        .from('v_ranking_estatisticas')
        .select('categoria_id, total')
        .eq('time_id', timeId)
        .eq('escopo', 'competicao'),
    ]);
    for (const r of [jogadores, categorias, ranking]) if (r.error) throw r.error;

    return {
      time,
      jogadores: jogadores.data ?? [],
      totais: (categorias.data ?? []).map((categoria) => ({
        categoria,
        total: (ranking.data ?? [])
          .filter((r) => r.categoria_id === categoria.id)
          .reduce((soma, r) => soma + (r.total ?? 0), 0),
      })),
    };
  },
};
