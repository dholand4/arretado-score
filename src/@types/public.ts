import type { ICategoria, IJogador, Modalidade, StatusCompeticao } from './competition';
import type { Tables } from './database';
import type { IJogoLista } from './game';

export type IPublicCompetition = Pick<
  Tables<'competicoes'>,
  'id' | 'nome' | 'slug' | 'logo_url' | 'descricao' | 'local_padrao' | 'permite_empate'
> & { modalidade: Modalidade; status: StatusCompeticao };

export type IPublicPlayer = Pick<IJogador, 'id' | 'time_id' | 'nome' | 'apelido' | 'numero' | 'foto_url'>;
export type IPublicCategory = Pick<ICategoria, 'id' | 'nome' | 'sigla' | 'titulo_ranking' | 'soma_no_placar'>;

export interface IRankingRow {
  categoria_id: string;
  jogador_id: string;
  time_id: string;
  total: number;
  jogos: number;
  media: number;
  jogador: IPublicPlayer | null;
  timeNome: string;
}

export interface IRankingData {
  categorias: IPublicCategory[];
  fases: { id: string; nome: string }[];
  linhas: IRankingRow[];
}

export interface IPublicGameDetail {
  jogo: IJogoLista;
  categorias: IPublicCategory[];
  jogadores: IPublicPlayer[];
  presentes: string[];
  estatisticas: Record<string, Record<string, number>>;
}

export interface IPublicTeamSummary extends Pick<Tables<'times'>, 'id' | 'nome' | 'sigla' | 'logo_url'> {
  jogadores: { count: number }[];
}

// Página do jogador (seção 6.7.1).
export type IPublicPlayerProfile = IPublicPlayer & Pick<IJogador, 'competicao_id' | 'posicao' | 'ativo'>;

export interface IPublicPlayerNumber {
  categoria: IPublicCategory;
  total: number;
  jogos: number;
  media: number;
}

// Um jogo do "jogo a jogo": o time pelo qual o jogador atuou e o valor de cada categoria.
export interface IPublicPlayerGame {
  jogo: IJogoLista;
  time_id: string;
  valores: Record<string, number>;
}

export interface IPublicPlayerDetail {
  jogador: IPublicPlayerProfile;
  time: Pick<Tables<'times'>, 'id' | 'nome' | 'sigla' | 'logo_url'> | null;
  // Presenças em jogos encerrados com súmula completa.
  jogosDisputados: number;
  numeros: IPublicPlayerNumber[];
  jogos: IPublicPlayerGame[];
}

export interface IPublicTeam {
  time: Pick<Tables<'times'>, 'id' | 'nome' | 'sigla' | 'logo_url'>;
  jogadores: IPublicPlayer[];
  totais: { categoria: IPublicCategory; total: number }[];
}
