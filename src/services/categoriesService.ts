import type { ICategoria, ICategoriaInput } from '@/@types/competition';
import { supabase } from './supabaseService';

export const categoriesService = {
  async list(competicaoId: string): Promise<ICategoria[]> {
    const { data, error } = await supabase
      .from('categorias_estatistica')
      .select('*')
      .eq('competicao_id', competicaoId)
      .order('ordem');
    if (error) throw error;
    return data;
  },

  async create(competicaoId: string, input: ICategoriaInput): Promise<ICategoria> {
    const { data, error } = await supabase
      .from('categorias_estatistica')
      .insert({ competicao_id: competicaoId, ...input })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, patch: Partial<ICategoriaInput & { ativa: boolean; ordem: number }>): Promise<ICategoria> {
    const { data, error } = await supabase.from('categorias_estatistica').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('categorias_estatistica').delete().eq('id', id);
    if (error) throw error;
  },

  // Troca a posição de duas categorias vizinhas.
  async swapOrder(a: ICategoria, b: ICategoria): Promise<void> {
    await this.update(a.id, { ordem: b.ordem ?? 0 });
    await this.update(b.id, { ordem: a.ordem ?? 0 });
  },
};
