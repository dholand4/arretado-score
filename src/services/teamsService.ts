import type {
  IJogador,
  IJogadorInput,
  ImageChange,
  ITime,
  ITimeDetalhe,
  ITimeInput,
  ITimeResumo,
} from '@/@types/competition';
import { BUCKETS, storagePaths } from '@/constants/storage';
import { storageService } from './storageService';
import { supabase } from './supabaseService';

const TEAM_DETAIL_SELECT = '*, dono:profiles(nome), competicao:competicoes(id, nome, status, modalidade)';

export const teamsService = {
  async list(competicaoId: string): Promise<ITimeResumo[]> {
    const { data, error } = await supabase
      .from('times')
      .select('*, dono:profiles(nome), jogadores(count)')
      .eq('competicao_id', competicaoId)
      .order('nome');
    if (error) throw error;
    return data as unknown as ITimeResumo[];
  },

  async listMine(userId: string): Promise<ITimeDetalhe[]> {
    const { data, error } = await supabase.from('times').select(TEAM_DETAIL_SELECT).eq('dono_id', userId).order('nome');
    if (error) throw error;
    return data as unknown as ITimeDetalhe[];
  },

  async get(timeId: string): Promise<ITimeDetalhe> {
    const { data, error } = await supabase.from('times').select(TEAM_DETAIL_SELECT).eq('id', timeId).single();
    if (error) throw error;
    return data as unknown as ITimeDetalhe;
  },

  async create(competicaoId: string, input: ITimeInput, logo: ImageChange): Promise<ITime> {
    const { data, error } = await supabase
      .from('times')
      .insert({ competicao_id: competicaoId, ...input, sigla: input.sigla || null })
      .select()
      .single();
    if (error) throw error;
    if (logo.kind !== 'replace') return data;
    return this.update(data.id, competicaoId, {}, logo);
  },

  // O dono do time só manda nome (e logo); sigla e dono são do admin.
  async update(timeId: string, competicaoId: string, patch: Partial<ITimeInput>, logo: ImageChange): Promise<ITime> {
    const logoUrl = await storageService.applyImageChange(
      logo,
      BUCKETS.logos,
      storagePaths.teamLogo(competicaoId, timeId),
    );
    const payload = {
      ...patch,
      ...(patch.sigla !== undefined && { sigla: patch.sigla || null }),
      ...(logoUrl !== undefined && { logo_url: logoUrl }),
    };
    const { data, error } = await supabase.from('times').update(payload).eq('id', timeId).select().single();
    if (error) throw error;
    return data;
  },

  async remove(timeId: string): Promise<void> {
    const { error } = await supabase.from('times').delete().eq('id', timeId);
    if (error) throw error;
  },
};

function toRow(input: IJogadorInput) {
  return {
    nome: input.nome,
    apelido: input.apelido || null,
    numero: input.numero,
    posicao: input.posicao || null,
    documento: input.documento || null,
    ativo: input.ativo,
  };
}

export const playersService = {
  async list(timeId: string): Promise<IJogador[]> {
    const { data, error } = await supabase
      .from('jogadores')
      .select('*')
      .eq('time_id', timeId)
      .order('ativo', { ascending: false })
      .order('numero', { nullsFirst: false })
      .order('nome');
    if (error) throw error;
    return data;
  },

  async create(time: Pick<ITime, 'id' | 'competicao_id'>, input: IJogadorInput, photo: ImageChange): Promise<IJogador> {
    // competicao_id é preenchido pelo banco a partir do time.
    const { data, error } = await supabase
      .from('jogadores')
      .insert({ ...toRow(input), time_id: time.id, competicao_id: time.competicao_id })
      .select()
      .single();
    if (error) throw error;
    if (photo.kind !== 'replace') return data;
    return this.update(data, input, photo);
  },

  async update(jogador: Pick<IJogador, 'id' | 'competicao_id'>, input: IJogadorInput, photo: ImageChange): Promise<IJogador> {
    const fotoUrl = await storageService.applyImageChange(
      photo,
      BUCKETS.fotosJogadores,
      storagePaths.playerPhoto(jogador.competicao_id, jogador.id),
    );
    const payload = { ...toRow(input), ...(fotoUrl !== undefined && { foto_url: fotoUrl }) };
    const { data, error } = await supabase.from('jogadores').update(payload).eq('id', jogador.id).select().single();
    if (error) throw error;
    return data;
  },

  async setActive(id: string, ativo: boolean): Promise<void> {
    const { error } = await supabase.from('jogadores').update({ ativo }).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('jogadores').delete().eq('id', id);
    if (error) throw error;
  },
};
