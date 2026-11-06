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
  dono: { nome: string; telefone: string | null } | null;
  jogadores: { count: number }[];
  // Nomes do elenco, para a busca na lista de times.
  elenco?: { nome: string; apelido: string | null }[];
}

export interface ITimeDetalhe extends ITime {
  dono: { nome: string; telefone: string | null } | null;
  competicao: Pick<ICompeticao, 'id' | 'nome' | 'slug' | 'status' | 'modalidade' | 'cobranca_modelo'>;
}

export interface ICompeticaoAdmin {
  user_id: string;
  created_at: string;
  profile: { nome: string; ativo: boolean } | null;
}

export interface IPessoaOpcao {
  id: string;
  nome: string;
  telefone?: string | null;
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
  // 1, 2 ou 3: preenchida pela súmula ao vivo com os lances desse valor. Nulo = digitada na súmula.
  conta_cestas_de: number | null;
}

export interface ITimeInput {
  nome: string;
  sigla: string;
  dono_id: string | null;
}

// Login do dono criado junto com o time (senha provisória, trocada no primeiro acesso).
export interface INovoDonoInput {
  nome: string;
  email: string;
  senha: string;
  // Opcional; vai só com dígitos.
  telefone: string;
}

// Telefone de uma equipe já cadastrada, alterado junto com o time (vazio limpa).
export interface IContatoEquipe {
  id: string;
  telefone: string | null;
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
