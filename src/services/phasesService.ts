import type { Json } from '@/@types/database';
import type { IJogoAndamento } from '@/@types/event';
import type { IDistribuicaoGrupos, IFase, IFasePayload } from '@/@types/phase';
import { supabase } from './supabaseService';

const PHASE_SELECT = '*, series(*), grupos(id, nome, grupo_times(time_id, time:times(nome)))';

export const phasesService = {
  async list(competicaoId: string): Promise<IFase[]> {
    const { data, error } = await supabase
      .from('fases')
      .select(PHASE_SELECT)
      .eq('competicao_id', competicaoId)
      .order('ordem')
      .order('nome', { referencedTable: 'grupos' });
    if (error) throw error;
    return data as unknown as IFase[];
  },

  // Grava todas as fases e as séries do mata-mata numa transação (RPC salvar_fases).
  async save(competicaoId: string, fases: IFasePayload[]): Promise<void> {
    const { error } = await supabase.rpc('salvar_fases', {
      p_competicao_id: competicaoId,
      p_fases: fases as unknown as Json,
    });
    if (error) throw error;
  },

  // Inicia a competição: fase 1 em andamento, grupos e jogos gerados. Devolve quantos jogos.
  async start(competicaoId: string, distribuicao?: IDistribuicaoGrupos): Promise<number> {
    const { data, error } = await supabase.rpc('iniciar_competicao', {
      p_competicao_id: competicaoId,
      ...(distribuicao && { p_distribuicao: distribuicao }),
    });
    if (error) throw error;
    return data;
  },

  async redrawGroups(faseId: string, distribuicao?: IDistribuicaoGrupos): Promise<number> {
    const { data, error } = await supabase.rpc('sortear_grupos', {
      p_fase_id: faseId,
      ...(distribuicao && { p_distribuicao: distribuicao }),
    });
    if (error) throw error;
    return data;
  },

  async listGamesProgress(competicaoId: string): Promise<IJogoAndamento[]> {
    const { data, error } = await supabase
      .from('jogos')
      .select('id, fase_id, status, evento_id')
      .eq('competicao_id', competicaoId);
    if (error) throw error;
    return data as IJogoAndamento[];
  },
};
