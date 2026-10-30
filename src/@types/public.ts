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

export interface IPublicTeam {
  time: Pick<Tables<'times'>, 'id' | 'nome' | 'sigla' | 'logo_url'>;
  jogadores: IPublicPlayer[];
  totais: { categoria: IPublicCategory; total: number }[];
}
