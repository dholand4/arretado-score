import type { Json } from '@/@types/database';
import type { ILance, ILinkMesa, IMesa, IMesaContexto, IOficiaisMesa, IRelogio } from '@/@types/liveSheet';
import { AppError } from '@/utils/appError';
import { supabase } from './supabaseService';

const REGRAS =
  'qtd_periodos, duracao_periodo_min, duracao_prorrogacao_min, faltas_bonus_equipe, faltas_exclusao_jogador, ' +
  'tempos_primeira_metade, tempos_segunda_metade, tempos_prorrogacao, relogio_posse, posse_segundos, posse_reset_curto';

type IJogoMesaBruto = {
  id: string;
  competicao_id: string;
  status: string;
  time_casa_id: string;
  time_fora_id: string;
  casa: IMesaContexto['casa'];
  fora: IMesaContexto['fora'];
  fase: { nome: string; tipo: string };
};

// Jogo da mesa: o coordenador lê direto; pelo link, a RPC devolve o jogo mesmo fora de um dia publicado.
async function loadGame(jogoId: string, token?: string): Promise<IJogoMesaBruto> {
  if (token) {
    const { data, error } = await supabase.rpc('mesa_pelo_link', { p_token: token });
    if (error) throw error;
    return data as unknown as IJogoMesaBruto;
  }
  const { data, error } = await supabase
    .from('jogos')
    .select(
      'id, competicao_id, status, time_casa_id, time_fora_id, ' +
        'casa:times!jogos_time_casa_id_fkey(id, nome, logo_url), fora:times!jogos_time_fora_id_fkey(id, nome, logo_url), ' +
        'fase:fases(nome, tipo)',
    )
    .eq('id', jogoId)
    .single();
  if (error) throw error;
  return data as unknown as IJogoMesaBruto;
}

// Súmula ao vivo (seção 6.5.1): leitura direta (RLS) e escrita só pelas RPCs mesa_*. Com `token`
// (link de mesa), opera sem login.
export const liveSheetService = {
  // Jogo do link de mesa (mesário sem login).
  async byToken(token: string): Promise<{ jogoId: string; competicaoId: string }> {
    const jogo = await loadGame('', token);
    return { jogoId: jogo.id, competicaoId: jogo.competicao_id };
  },

  async getContext(jogoId: string, token?: string): Promise<IMesaContexto> {
    const j = await loadGame(jogoId, token);

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

  async open(jogoId: string, token?: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_abrir', { p_jogo_id: jogoId, ...(token && { p_token: token }) });
    if (error) throw error;
  },

  async lineup(jogoId: string, escalados: string[], oficiais: IOficiaisMesa, token?: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_escalar', {
      p_jogo_id: jogoId,
      p_escalados: escalados,
      p_oficiais: oficiais as unknown as Json,
      ...(token && { p_token: token }),
    });
    if (error) throw error;
  },

  async clock(jogoId: string, relogio: IRelogio, token?: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_relogio', {
      ...(token && { p_token: token }),
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

  async addLance(lance: ILance, token?: string): Promise<void> {
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
    const { error } = await supabase.rpc('mesa_lance', { p_lance: payload, ...(token && { p_token: token }) });
    if (error) throw error;
  },

  async voidLance(lanceId: string, token?: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_anular', { p_lance_id: lanceId, ...(token && { p_token: token }) });
    if (error) throw error;
  },

  // Mesário (link) encerra: vai para a aprovação do coordenador.
  async finish(jogoId: string, token?: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_finalizar', { p_jogo_id: jogoId, ...(token && { p_token: token }) });
    if (error) throw error;
  },

  // Coordenador devolve a mesa para o mesário corrigir.
  async reopen(jogoId: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_reabrir', { p_jogo_id: jogoId });
    if (error) throw error;
  },

  // Situação das mesas abertas da competição (para a lista de jogos do coordenador).
  async openStatuses(competicaoId: string): Promise<Map<string, IMesa['status']>> {
    const { data, error } = await supabase
      .from('jogo_mesa')
      .select('jogo_id, status')
      .eq('competicao_id', competicaoId)
      .neq('status', 'encerrada');
    if (error) throw error;
    return new Map(data.map((m) => [m.jogo_id, m.status as IMesa['status']]));
  },

  // Link de mesa ativo do jogo (nulo se não houver).
  async activeLink(jogoId: string): Promise<ILinkMesa | null> {
    const { data, error } = await supabase
      .from('mesa_links')
      .select('token, expira_em')
      .eq('jogo_id', jogoId)
      .is('revogado_em', null)
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createLink(jogoId: string): Promise<ILinkMesa> {
    const { data, error } = await supabase.rpc('mesa_gerar_link', { p_jogo_id: jogoId });
    if (error) throw error;
    return data as unknown as ILinkMesa;
  },

  async cancelLink(jogoId: string): Promise<void> {
    const { error } = await supabase.rpc('mesa_cancelar_link', { p_jogo_id: jogoId });
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
