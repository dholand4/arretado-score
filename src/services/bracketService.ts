import { supabase } from './supabaseService';

export const bracketService = {
  async load(slug: string) {
    const competition = await supabase.from('competicoes').select('id,nome,status').eq('slug', slug).single();
    if (competition.error) throw competition.error;
    const [phases, teams, games] = await Promise.all([
      supabase.from('fases').select('id,nome,ordem,disputa_terceiro').eq('competicao_id', competition.data.id).eq('tipo', 'mata_mata').order('ordem'),
      supabase.from('times').select('id,nome,logo_url').eq('competicao_id', competition.data.id),
      supabase.from('jogos').select('id,serie_id,numero_na_serie,time_casa_id,time_fora_id,placar_casa,placar_fora,status,inicio_previsto').eq('competicao_id', competition.data.id).not('serie_id', 'is', null).order('numero_na_serie'),
    ]);
    if (phases.error) throw phases.error;
    if (teams.error) throw teams.error;
    if (games.error) throw games.error;
    const series = phases.data.length
      ? await supabase.from('series').select('*').in('fase_id', phases.data.map((phase) => phase.id)).order('codigo')
      : { data: [], error: null };
    if (series.error) throw series.error;
    return { competition: competition.data, phases: phases.data, teams: teams.data, games: games.data, series: series.data };
  },
};
export type BracketData = Awaited<ReturnType<typeof bracketService.load>>;
