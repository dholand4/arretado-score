import type { Json } from '@/@types/database';
import { supabase } from './supabaseService';

export const gamesService = {
  async context(competitionId: string) {
    const [games, phases, teams, groups] = await Promise.all([
      supabase.from('jogos').select('*').eq('competicao_id', competitionId).order('rodada'),
      supabase.from('fases').select('*').eq('competicao_id', competitionId).order('ordem'),
      supabase.from('times').select('*').eq('competicao_id', competitionId).order('nome'),
      supabase.from('grupos').select('*').order('nome'),
    ]);
    if (games.error) throw games.error;
    if (phases.error) throw phases.error;
    if (teams.error) throw teams.error;
    if (groups.error) throw groups.error;
    return { games: games.data, phases: phases.data, teams: teams.data, groups: groups.data };
  },
  async sheet(competitionId: string, gameId: string) {
    const [context, competition, players, categories, presence, statistics] = await Promise.all([
      this.context(competitionId),
      supabase.from('competicoes').select('*').eq('id', competitionId).single(),
      supabase.from('jogadores').select('*').eq('competicao_id', competitionId).eq('ativo', true).order('nome'),
      supabase.from('categorias_estatistica').select('*').eq('competicao_id', competitionId).eq('ativa', true).order('ordem'),
      supabase.from('jogo_jogadores').select('*').eq('jogo_id', gameId),
      supabase.from('sumula_estatisticas').select('*').eq('jogo_id', gameId),
    ]);
    if (competition.error) throw competition.error;
    if (players.error) throw players.error;
    if (categories.error) throw categories.error;
    if (presence.error) throw presence.error;
    if (statistics.error) throw statistics.error;
    const game = context.games.find((item) => item.id === gameId);
    if (!game) throw new Error('Jogo não encontrado nesta competição.');
    return { ...context, game, competition: competition.data, players: players.data, categories: categories.data, presence: presence.data, statistics: statistics.data };
  },
  async save(gameId: string, mode: string, casa: number | null, fora: number | null, ausente: string | null, jogadores: Json) {
    const { error } = await supabase.rpc('registrar_resultado_jogo', { p_jogo_id: gameId, p_modo: mode, p_casa: casa ?? undefined, p_fora: fora ?? undefined, p_ausente: ausente ?? undefined, p_jogadores: jogadores });
    if (error) throw error;
  },
  async standings(slug: string) {
    const competition = await supabase.from('competicoes').select('*').eq('slug', slug).single();
    if (competition.error) throw competition.error;
    const [phases, groups] = await Promise.all([
      supabase.from('fases').select('*').eq('competicao_id', competition.data.id).neq('tipo', 'mata_mata').order('ordem'),
      supabase.from('grupos').select('*'),
    ]);
    if (phases.error) throw phases.error;
    if (groups.error) throw groups.error;
    return { competition: competition.data, phases: phases.data, groups: groups.data };
  },
  async adjust(phase: string, group: string | null, team: string, priority: number | null) {
    const { error } = await supabase.rpc('ajustar_classificacao', { p_fase_id: phase, p_grupo_id: group ?? undefined, p_time_id: team, p_prioridade: priority ?? undefined });
    if (error) throw error;
  },
  async extras(phase: string, position: number) {
    const { data, error } = await supabase.rpc('melhores_extras', { p_fase_id: phase, p_posicao: position });
    if (error) throw error;
    return data;
  },
  async classification(phase: string, group: string | null) {
    const { data, error } = await supabase.rpc('classificacao_ordenada', { p_fase_id: phase, p_grupo_id: group ?? undefined });
    if (error) throw error;
    return data;
  },
};
