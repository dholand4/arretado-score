import type { Tables } from './database';

export type StatusEvento = 'rascunho' | 'publicado';
export type StatusJogo = 'pendente' | 'agendado' | 'encerrado' | 'wo' | 'cancelado';

interface ITimeNoJogo {
  nome: string;
  sigla: string | null;
}

// Jogo com os nomes dos times, da fase e do grupo (listas do painel).
export type IJogoResumo = Omit<Tables<'jogos'>, 'status'> & {
  status: StatusJogo;
  casa: ITimeNoJogo | null;
  fora: ITimeNoJogo | null;
  fase: { nome: string } | null;
  grupo: { nome: string } | null;
  serie: { codigo: string } | null;
};

export type IEvento = Omit<Tables<'eventos'>, 'status'> & {
  status: StatusEvento;
  jogos: IJogoResumo[];
};

export interface IEventoInput {
  data: string;
  local: string;
  hora_inicio: string;
  qtd_jogos: number;
  intervalo_min: number;
  observacoes: string;
  // Times que vão estar no dia; nulo = todos (o sorteio usa só jogos entre eles).
  times: string[] | null;
}

// Resposta de criar_evento / sortear_evento (seção 6.2).
export interface IMontagemEvento {
  precisa_confirmar: boolean;
  max_sem_repeticao: number;
  candidatos: number;
  pedido: number;
  jogo_duplo: boolean;
  jogos: string[];
  evento_id: string | null;
}

// Resumo dos jogos para a visão geral (andamento das fases).
export interface IJogoAndamento {
  id: string;
  fase_id: string;
  status: StatusJogo;
  evento_id: string | null;
}
