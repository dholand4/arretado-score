import type { IEvento, IEventoInput, IJogoResumo, IMontagemEvento } from '@/@types/event';
import { supabase } from './supabaseService';

const GAME_SELECT =
  '*, casa:times!jogos_time_casa_id_fkey(nome, sigla), fora:times!jogos_time_fora_id_fkey(nome, sigla), fase:fases(nome), grupo:grupos(nome), serie:series(codigo)';

export const eventsService = {
  async list(competicaoId: string): Promise<IEvento[]> {
    const { data, error } = await supabase
      .from('eventos')
      .select(`*, jogos(${GAME_SELECT})`)
      .eq('competicao_id', competicaoId)
      .order('data', { ascending: false })
      .order('hora_inicio', { ascending: false })
      .order('ordem_no_evento', { referencedTable: 'jogos' });
    if (error) throw error;
    return data as unknown as IEvento[];
  },

  // Jogos que podem entrar num dia (para "trocar jogo").
  async listCandidates(competicaoId: string): Promise<IJogoResumo[]> {
    const { data, error } = await supabase
      .rpc('jogos_candidatos_evento', { p_competicao_id: competicaoId })
      .select(GAME_SELECT);
    if (error) throw error;
    return data as unknown as IJogoResumo[];
  },

  // Cria o dia e sorteia os jogos. Se precisar de jogo duplo, nada é gravado e a resposta pede confirmação.
  async create(competicaoId: string, input: IEventoInput, permitirDuplo: boolean): Promise<IMontagemEvento> {
    const { data, error } = await supabase.rpc('criar_evento', {
      p_competicao_id: competicaoId,
      p_data: input.data,
      p_local: input.local,
      p_hora_inicio: input.hora_inicio,
      p_qtd_jogos: input.qtd_jogos,
      p_intervalo_min: input.intervalo_min,
      p_observacoes: input.observacoes,
      p_permitir_duplo: permitirDuplo,
    });
    if (error) throw error;
    return data as unknown as IMontagemEvento;
  },

  // Sorteia de novo os jogos do dia em rascunho (qtdJogos troca a quantidade pedida).
  async redraw(eventoId: string, permitirDuplo: boolean, qtdJogos?: number): Promise<IMontagemEvento> {
    const { data, error } = await supabase.rpc('sortear_evento', {
      p_evento_id: eventoId,
      p_permitir_duplo: permitirDuplo,
      ...(qtdJogos !== undefined && { p_qtd_jogos: qtdJogos }),
    });
    if (error) throw error;
    return data as unknown as IMontagemEvento;
  },

  async reorder(eventoId: string, jogoIds: string[]): Promise<void> {
    const { error } = await supabase.rpc('reordenar_evento', { p_evento_id: eventoId, p_jogos: jogoIds });
    if (error) throw error;
  },

  async swapGame(saiId: string, entraId: string): Promise<void> {
    const { error } = await supabase.rpc('trocar_jogo_evento', { p_jogo_sai: saiId, p_jogo_entra: entraId });
    if (error) throw error;
  },

  async removeGame(jogoId: string): Promise<void> {
    const { error } = await supabase.rpc('remover_jogo_evento', { p_jogo_id: jogoId });
    if (error) throw error;
  },

  async publish(eventoId: string): Promise<void> {
    const { error } = await supabase.rpc('publicar_evento', { p_evento_id: eventoId });
    if (error) throw error;
  },

  async remove(eventoId: string): Promise<number> {
    const { data, error } = await supabase.rpc('excluir_evento', { p_evento_id: eventoId });
    if (error) throw error;
    return data;
  },
};
