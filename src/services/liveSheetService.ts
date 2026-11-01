import type { Json } from '@/@types/database';
import type { ILance, IMesa, IMesaContexto, IOficiaisMesa, IRelogio } from '@/@types/liveSheet';
import { AppError } from '@/utils/appError';
import { supabase } from './supabaseService';

const REGRAS =
  'qtd_periodos, duracao_periodo_min, duracao_prorrogacao_min, faltas_bonus_equipe, faltas_exclusao_jogador, ' +
  'tempos_primeira_metade, tempos_segunda_metade, tempos_prorrogacao, relogio_posse, posse_segundos, posse_reset_curto';

// Súmula ao vivo (seção 6.5.1): leitura direta (RLS) e escrita só pelas RPCs mesa_*.
export const liveSheetService = {
  async getContext(jogoId: string): Promise<IMesaContexto> {
    const { data: jogo, error } = await supabase
      .from('jogos')
      .select(
        'id, competicao_id, status, time_casa_id, time_fora_id, ' +
          'casa:times!jogos_time_casa_id_fkey(id, nome, logo_url), fora:times!jogos_time_fora_id_fkey(id, nome, logo_url), ' +
          'fase:fases(nome, tipo)',
      )
      .eq('id', jogoId)
      .single();
    if (error) throw error;
    const j = jogo as unknown as {
      id: string;
      competicao_id: string;
      status: string;
      time_casa_id: string;
      time_fora_id: string;
      casa: IMesaContexto['casa'];
      fora: IMesaContexto['fora'];
      fase: { nome: string; tipo: string };
    };

    const [competicao, jogadores, mesa, lances] = await Promise.all([
      supabase.from('competicoes').select(`nome, permite_empate, ${REGRAS}`).eq('id', j.competicao_id).single(),
      supabase
        .from('jogadores')
        .select('id, time_id, nome, apelido, numero')
        .in('time_id', [j.time_casa_id, j.time_fora_id])
        .eq('ativo', true)
        .order('numero', { nullsFirst: false })
        .order('nome'),
      supabase.from('jogo_mesa').select('*').eq('jogo_id', jogoId).maybeSingle(),
      supabase
        .from('jogo_lances')
        .select('id, jogo_id, periodo, tempo_restante_ms, tipo, time_id, jogador_id, valor, tipo_falta, anulado')
        .eq('jogo_id', jogoId)
        .order('seq'),
    ]);
    for (const r of [competicao, jogadores, mesa, lances]) if (r.error) throw r.error;
    if (!competicao.data) throw new AppError('Competição não encontrada.');
    const { nome, permite_empate, ...regras } = competicao.data as unknown as IMesaContexto['competicao'] & {
      permite_empate: boolean;
    };

    return {
      jogo: {
        id: j.id,
        competicao_id: j.competicao_id,
        status: j.status,
        fase: j.fase.nome,
        empatePermitido: permite_empate && j.fase.tipo !== 'mata_mata',
      },
      competicao: { nome, ...regras },
      casa: j.casa,
      fora: j.fora,
      jogadores: jogadores.data ?? [],
      mesa: (mesa.data as IMesa | null) ?? null,
      lances: (lances.data ?? []) as ILance[],
    };
  },

  async serverTime(): Promise<number> {
    const { data, error } = await supabase.rpc('hora_servidor');
    if (error) throw error;
    return new Date(data).getTime();
  },

  async open(jogoId: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_abrir', { p_jogo_id: jogoId });
    if (error) throw error;
  },

  async lineup(jogoId: string, escalados: string[], oficiais: IOficiaisMesa): Promise<void> {
    const { error } = await supabase.rpc('mesa_escalar', {
      p_jogo_id: jogoId,
      p_escalados: escalados,
      p_oficiais: oficiais as unknown as Json,
    });
    if (error) throw error;
  },

  async clock(jogoId: string, relogio: IRelogio): Promise<void> {
    const { error } = await supabase.rpc('mesa_relogio', {
      p_jogo_id: jogoId,
      p_estado: {
        periodo: relogio.periodo,
        restante_ms: Math.round(relogio.restanteMs),
        posse_ms: relogio.posseMs === null ? null : Math.round(relogio.posseMs),
        rodando: relogio.rodando,
        referencia_ms: Math.round(relogio.referenciaMs),
      },
    });
    if (error) throw error;
  },

  async addLance(lance: ILance): Promise<void> {
    const payload = {
      id: lance.id,
      jogo_id: lance.jogo_id,
      periodo: lance.periodo,
      tempo_restante_ms: lance.tempo_restante_ms,
      tipo: lance.tipo,
      time_id: lance.time_id,
      jogador_id: lance.jogador_id,
      valor: lance.valor,
      tipo_falta: lance.tipo_falta,
    };
    const { error } = await supabase.rpc('mesa_lance', { p_lance: payload });
    if (error) throw error;
  },

  async voidLance(lanceId: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_anular', { p_lance_id: lanceId });
    if (error) throw error;
  },

  async close(jogoId: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_encerrar', { p_jogo_id: jogoId });
    if (error) throw error;
  },

  async discard(jogoId: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_descartar', { p_jogo_id: jogoId });
    if (error) throw error;
  },
};
