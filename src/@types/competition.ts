import type { Tables } from './database';

export type Modalidade = 'basquete' | 'futsal' | 'volei' | 'outro';
export type StatusCompeticao = 'rascunho' | 'em_andamento' | 'encerrada';
export type CriterioDesempate = 'confronto_direto' | 'saldo' | 'pontos_pro' | 'vitorias';
export type CobrancaModelo = 'nenhuma' | 'por_time' | 'por_jogador';

export type ICompeticao = Omit<
  Tables<'competicoes'>,
  'modalidade' | 'status' | 'criterios_desempate' | 'cobranca_modelo'
> & {
  modalidade: Modalidade;
  status: StatusCompeticao;
  criterios_desempate: CriterioDesempate[];
  cobranca_modelo: CobrancaModelo;
};

export type ICategoria = Tables<'categorias_estatistica'>;
export type ITime = Tables<'times'>;
export type IJogador = Tables<'jogadores'>;

export interface ITimeResumo extends ITime {
  dono: { nome: string } | null;
  jogadores: { count: number }[];
}

export interface ITimeDetalhe extends ITime {
  dono: { nome: string } | null;
  competicao: Pick<ICompeticao, 'id' | 'nome' | 'status' | 'modalidade'>;
}

export interface ICompeticaoAdmin {
  user_id: string;
  created_at: string;
  profile: { nome: string; ativo: boolean } | null;
}

export interface IPessoaOpcao {
  id: string;
  nome: string;
}

export interface ICompeticaoBasicos {
  nome: string;
  slug: string;
  modalidade: Modalidade;
  descricao: string;
  local_padrao: string;
  intervalo_jogos_min: number;
}

export type ICompeticaoPontuacao = Pick<
  ICompeticao,
  | 'pontos_vitoria'
  | 'pontos_derrota'
  | 'pontos_derrota_wo'
  | 'permite_empate'
  | 'pontos_empate'
  | 'wo_placar_vencedor'
  | 'wo_placar_perdedor'
  | 'criterios_desempate'
>;

export interface ICategoriaInput {
  nome: string;
  sigla: string;
  titulo_ranking: string;
}

export interface ITimeInput {
  nome: string;
  sigla: string;
  dono_id: string | null;
}

export interface IJogadorInput {
  nome: string;
  apelido: string;
  numero: number | null;
  posicao: string;
  documento: string;
  ativo: boolean;
}

// Mudança de imagem num formulário: manter, trocar por um arquivo novo ou remover.
export type ImageChange = { kind: 'keep' } | { kind: 'replace'; file: File } | { kind: 'remove' };
