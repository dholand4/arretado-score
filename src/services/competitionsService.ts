import type {
  ICompeticao,
  ICompeticaoAdmin,
  ICompeticaoBasicos,
  ICompeticaoPontuacao,
  ImageChange,
  IPessoaOpcao,
} from '@/@types/competition';
import type { ICompeticaoCobranca } from '@/@types/finance';
import { BUCKETS, storagePaths } from '@/constants/storage';
import { storageService } from './storageService';
import { supabase } from './supabaseService';

export interface ICompetitionListItem extends ICompeticao {
  times: { count: number }[];
}

export const competitionsService = {
  // RLS decide o que aparece: master vê todas, admin as suas, dono as dos seus times.
  async list(): Promise<ICompetitionListItem[]> {
    const { data, error } = await supabase
      .from('competicoes')
      .select('*, times(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as ICompetitionListItem[];
  },

  async listPublic(): Promise<ICompeticao[]> {
    const { data, error } = await supabase
      .from('competicoes')
      .select('*')
      .neq('status', 'rascunho')
      .order('status')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as ICompeticao[];
  },

  async get(id: string): Promise<ICompeticao> {
    const { data, error } = await supabase.from('competicoes').select('*').eq('id', id).single();
    if (error) throw error;
    return data as unknown as ICompeticao;
  },

  async create(input: ICompeticaoBasicos, logo: ImageChange): Promise<string> {
    const { data: id, error } = await supabase.rpc('criar_competicao', {
      p_nome: input.nome,
      p_slug: input.slug,
      p_modalidade: input.modalidade,
      p_descricao: input.descricao,
      p_local_padrao: input.local_padrao,
      p_intervalo_jogos_min: input.intervalo_jogos_min,
    });
    if (error) throw error;
    if (logo.kind === 'replace') {
      const url = await storageService.uploadImage(BUCKETS.logos, storagePaths.competitionLogo(id), logo.file);
      await this.update(id, { logo_url: url });
    }
    return id;
  },

  async update(
    id: string,
    patch: Partial<ICompeticaoBasicos & ICompeticaoPontuacao & ICompeticaoCobranca & { logo_url: string | null }>,
  ): Promise<ICompeticao> {
    const { data, error } = await supabase.from('competicoes').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data as unknown as ICompeticao;
  },

  // Desativa (some do público e do dono, fica só consulta no painel) ou reativa a liga.
  async setActive(id: string, ativa: boolean): Promise<void> {
    const { error } = await supabase.rpc('definir_liga_ativa', { p_competicao_id: id, p_ativa: ativa });
    if (error) throw error;
  },

  async updateBasics(id: string, input: ICompeticaoBasicos, logo: ImageChange): Promise<ICompeticao> {
    const logoUrl = await storageService.applyImageChange(logo, BUCKETS.logos, storagePaths.competitionLogo(id));
    return this.update(id, { ...input, ...(logoUrl !== undefined && { logo_url: logoUrl }) });
  },

  async listAdmins(competicaoId: string): Promise<ICompeticaoAdmin[]> {
    const { data, error } = await supabase
      .from('competicao_admins')
      .select('user_id, created_at, profile:profiles(nome, ativo)')
      .eq('competicao_id', competicaoId)
      .order('created_at');
    if (error) throw error;
    return data as unknown as ICompeticaoAdmin[];
  },

  async addAdmin(competicaoId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('competicao_admins').insert({ competicao_id: competicaoId, user_id: userId });
    if (error) throw error;
  },

  async removeAdmin(competicaoId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('competicao_admins')
      .delete()
      .eq('competicao_id', competicaoId)
      .eq('user_id', userId);
    if (error) throw error;
  },
};

export const peopleService = {
  // Admin enxerga nome/papel dos donos para vincular (seção 10.2).
  async listDonos(): Promise<IPessoaOpcao[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('papel', 'dono_time')
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    return data;
  },

  async listAdmins(): Promise<IPessoaOpcao[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('papel', 'admin')
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    return data;
  },
};
