import type { ICategoria, IJogador } from './competition';
import type { Database, Tables } from './database';
import type { IJogoResumo, StatusJogo } from './event';

export type ModoResultado = 'completa' | 'placar' | 'wo';
export type WoAusente = 'casa' | 'fora' | 'ambos';

// Jogo da lista do painel, com o dia de jogos (data e local).
export type IJogoLista = IJogoResumo & {
  evento: Pick<Tables<'eventos'>, 'data' | 'local' | 'status'> | null;
};

export interface IJogosContexto {
  jogos: IJogoLista[];
  fases: Pick<Tables<'fases'>, 'id' | 'nome' | 'ordem' | 'tipo' | 'status' | 'classificam' | 'melhores_extras'>[];
  times: Pick<Tables<'times'>, 'id' | 'nome'>[];
  grupos: Pick<Tables<'grupos'>, 'id' | 'fase_id' | 'nome'>[];
}

export interface ISumula {
  jogo: Omit<Tables<'jogos'>, 'status' | 'wo_ausente'> & { status: StatusJogo; wo_ausente: WoAusente | null };
  casa: string;
  fora: string;
  competicao: Pick<Tables<'competicoes'>, 'id' | 'permite_empate' | 'wo_placar_vencedor' | 'wo_placar_perdedor'>;
  fase: Pick<Tables<'fases'>, 'id' | 'nome' | 'tipo'>;
  // Fase concluída e a seguinte já tem resultado: só o master edita (seção 6.5).
  edicaoRestrita: boolean;
  jogadores: Pick<IJogador, 'id' | 'time_id' | 'nome' | 'apelido' | 'numero'>[];
  categorias: Pick<ICategoria, 'id' | 'nome' | 'sigla' | 'soma_no_placar'>[];
  presentes: string[];
  estatisticas: Record<string, Record<string, number>>;
}

// Súmula em papel, impressa antes do jogo já com times, data, local e elencos.
export interface ISumulaImpressa {
  competicao: Pick<Tables<'competicoes'>, 'nome' | 'logo_url'>;
  casa: string;
  fora: string;
  fase: string;
  grupo: string | null;
  inicioPrevisto: string | null;
  evento: Pick<Tables<'eventos'>, 'data' | 'local'> | null;
  casaJogadores: Pick<IJogador, 'id' | 'nome' | 'numero'>[];
  foraJogadores: Pick<IJogador, 'id' | 'nome' | 'numero'>[];
}

export interface IResultadoInput {
  modo: ModoResultado;
  casa: number | null;
  fora: number | null;
  ausente: WoAusente | null;
  jogadores: { jogador_id: string; valores: Record<string, number> }[];
}

export type IClassificacaoLinha = Database['public']['Functions']['classificacao_ordenada']['Returns'][number];
export type IMelhorExtra = Database['public']['Functions']['melhores_extras']['Returns'][number];
// Tabela de uma fase de mata-mata com melhores perdedores (repescagem).
export type SituacaoMataMata = 'venceu' | 'em_disputa' | 'repescagem' | 'eliminado';
export type ILinhaMataMata = Omit<
  Database['public']['Functions']['classificacao_mata_mata']['Returns'][number],
  'situacao'
> & { situacao: SituacaoMataMata };

export interface ITabelaPublica {
  competicao: Pick<Tables<'competicoes'>, 'id' | 'nome' | 'slug' | 'permite_empate'>;
  fases: Pick<Tables<'fases'>, 'id' | 'nome' | 'ordem' | 'tipo' | 'classificam' | 'melhores_extras'>[];
  grupos: Pick<Tables<'grupos'>, 'id' | 'fase_id' | 'nome'>[];
}
