import type {
  IClassificacaoLinha,
  IJogosContexto,
  IJogoLista,
  IMelhorExtra,
  IResultadoInput,
  ISumula,
  ITabelaPublica,
} from '@/@types/game';
import { AppError } from '@/utils/appError';
import { supabase } from './supabaseService';

export const GAME_LIST_SELECT =
  '*, casa:times!jogos_time_casa_id_fkey(nome, sigla), fora:times!jogos_time_fora_id_fkey(nome, sigla), ' +
  'fase:fases(nome), grupo:grupos(nome), serie:series(codigo), evento:eventos(data, local, status)';

const PHASE_FIELDS = 'id, nome, ordem, tipo, status, classificam, melhores_extras';

async function groupsOf(faseIds: string[]) {
  if (faseIds.length === 0) return [];
  const { data, error } = await supabase.from('grupos').select('id, fase_id, nome').in('fase_id', faseIds).order('nome');
  if (error) throw error;
  return data;
}

export const gamesService = {
  async listContext(competicaoId: string): Promise<IJogosContexto> {
    const [jogos, fases, times] = await Promise.all([
      supabase
        .from('jogos')
        .select(GAME_LIST_SELECT)
        .eq('competicao_id', competicaoId)
        .order('inicio_previsto', { nullsFirst: false })
        .order('rodada')
        .order('numero_na_serie'),
      supabase.from('fases').select(PHASE_FIELDS).eq('competicao_id', competicaoId).order('ordem'),
      supabase.from('times').select('id, nome').eq('competicao_id', competicaoId).order('nome'),
    ]);
    if (jogos.error) throw jogos.error;
    if (fases.error) throw fases.error;
    if (times.error) throw times.error;
    const grupos = await groupsOf(fases.data.map((f) => f.id));
    return { jogos: jogos.data as unknown as IJogoLista[], fases: fases.data, times: times.data, grupos };
  },

  async getScoreSheet(jogoId: string): Promise<ISumula> {
    const { data: jogo, error } = await supabase
      .from('jogos')
      .select('*, casa:times!jogos_time_casa_id_fkey(nome), fora:times!jogos_time_fora_id_fkey(nome), fase:fases(id, nome, tipo, ordem, status)')
      .eq('id', jogoId)
      .single();
    if (error) throw error;
    const { casa, fora, fase, ...resto } = jogo as typeof jogo & {
      casa: { nome: string };
      fora: { nome: string };
      fase: { id: string; nome: string; tipo: string; ordem: number; status: string };
    };

    const [competicao, jogadores, categorias, presencas, estatisticas, seguinte] = await Promise.all([
      supabase
        .from('competicoes')
        .select('id, permite_empate, wo_placar_vencedor, wo_placar_perdedor')
        .eq('id', resto.competicao_id)
        .single(),
      supabase
        .from('jogadores')
        .select('id, time_id, nome, apelido, numero')
        .in('time_id', [resto.time_casa_id, resto.time_fora_id])
        .eq('ativo', true),
      supabase
        .from('categorias_estatistica')
        .select('id, nome, sigla, soma_no_placar')
        .eq('competicao_id', resto.competicao_id)
        .eq('ativa', true)
        .order('ordem'),
      supabase.from('jogo_jogadores').select('jogador_id').eq('jogo_id', jogoId),
      supabase.from('sumula_estatisticas').select('jogador_id, categoria_id, valor').eq('jogo_id', jogoId),
      supabase
        .from('jogos')
        .select('id, fase:fases!inner(ordem)', { count: 'exact', head: true })
        .eq('competicao_id', resto.competicao_id)
        .eq('fase.ordem', fase.ordem + 1)
        .in('status', ['encerrado', 'wo']),
    ]);
    for (const r of [competicao, jogadores, categorias, presencas, estatisticas, seguinte]) {
      if (r.error) throw r.error;
    }
    if (!competicao.data) throw new AppError('Competição não encontrada.');

    const porJogador: ISumula['estatisticas'] = {};
    for (const e of estatisticas.data ?? []) {
      porJogador[e.jogador_id] = { ...porJogador[e.jogador_id], [e.categoria_id]: e.valor };
    }

    return {
      jogo: resto as ISumula['jogo'],
      casa: casa.nome,
      fora: fora.nome,
      competicao: competicao.data,
      fase: { id: fase.id, nome: fase.nome, tipo: fase.tipo },
      edicaoRestrita: fase.status === 'concluida' && (seguinte.count ?? 0) > 0,
      jogadores: jogadores.data ?? [],
      categorias: categorias.data ?? [],
      presentes: (presencas.data ?? []).map((p) => p.jogador_id),
      estatisticas: porJogador,
    };
  },

  // Uma única RPC transacional grava súmula, "só placar" ou W.O. (seção 6.5).
  async saveResult(jogoId: string, input: IResultadoInput): Promise<void> {
    const { error } = await supabase.rpc('registrar_resultado_jogo', {
      p_jogo_id: jogoId,
      p_modo: input.modo,
      p_casa: input.casa ?? undefined,
      p_fora: input.fora ?? undefined,
      p_ausente: input.ausente ?? undefined,
      p_jogadores: input.jogadores,
    });
    if (error) throw error;
  },

  async getPublicStandings(slug: string): Promise<ITabelaPublica> {
    const { data: competicao, error } = await supabase
      .from('competicoes')
      .select('id, nome, slug, permite_empate')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!competicao) throw new AppError('Competição não encontrada.');
    const { data: fases, error: fasesError } = await supabase
      .from('fases')
      .select('id, nome, ordem, tipo, classificam, melhores_extras')
      .eq('competicao_id', competicao.id)
      .neq('tipo', 'mata_mata')
      .order('ordem');
    if (fasesError) throw fasesError;
    return { competicao, fases, grupos: await groupsOf(fases.map((f) => f.id)) };
  },

  async getClassification(faseId: string, grupoId: string | null): Promise<IClassificacaoLinha[]> {
    const { data, error } = await supabase.rpc('classificacao_ordenada', {
      p_fase_id: faseId,
      ...(grupoId && { p_grupo_id: grupoId }),
    });
    if (error) throw error;
    return data;
  },

  async getBestExtras(faseId: string, colocacao: number): Promise<IMelhorExtra[]> {
    const { data, error } = await supabase.rpc('melhores_extras', { p_fase_id: faseId, p_posicao: colocacao });
    if (error) throw error;
    return data;
  },

  // Prévia dos confrontos (método do círculo, a mesma função que gera os jogos ao iniciar).
  async previewRoundRobin(qtdTimes: number, turnos: number) {
    const { data, error } = await supabase.rpc('rodizio', { p_n: qtdTimes, p_turnos: turnos });
    if (error) throw error;
    return data;
  },

  // Desempate manual de empate técnico (seção 6.3); prioridade nula remove o ajuste.
  async adjustClassification(faseId: string, grupoId: string | null, timeId: string, prioridade: number | null) {
    const { error } = await supabase.rpc('ajustar_classificacao', {
      p_fase_id: faseId,
      p_time_id: timeId,
      ...(grupoId && { p_grupo_id: grupoId }),
      ...(prioridade !== null && { p_prioridade: prioridade }),
    });
    if (error) throw error;
  },
};
