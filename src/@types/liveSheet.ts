import type { Tables } from './database';

// Súmula ao vivo (seção 6.5.1).
export type TipoLance = 'ponto' | 'falta' | 'tempo';
export type TipoFalta = 'pessoal' | 'tecnica' | 'antidesportiva' | 'desqualificante';
export type LadoMesa = 'casa' | 'fora';
// aguardando_aprovacao: o mesário (pelo link) encerrou e o coordenador ainda não aprovou.
export type StatusMesa = 'em_andamento' | 'aguardando_aprovacao' | 'encerrada';

export type IRegrasPartida = Pick<
  Tables<'competicoes'>,
  | 'qtd_periodos'
  | 'duracao_periodo_min'
  | 'duracao_prorrogacao_min'
  | 'faltas_bonus_equipe'
  | 'faltas_exclusao_jogador'
  | 'tempos_primeira_metade'
  | 'tempos_segunda_metade'
  | 'tempos_prorrogacao'
  | 'relogio_posse'
  | 'posse_segundos'
  | 'posse_reset_curto'
  | 'falta_para_relogio'
>;

export type IMesa = Omit<Tables<'jogo_mesa'>, 'status'> & { status: StatusMesa };

export interface ILance {
  id: string;
  jogo_id: string;
  periodo: number;
  tempo_restante_ms: number;
  tipo: TipoLance;
  time_id: string;
  jogador_id: string | null;
  valor: number | null;
  tipo_falta: TipoFalta | null;
  anulado: boolean;
  // Ainda na fila do aparelho, sem confirmação do servidor.
  pendente?: boolean;
}

// Relógios num instante: quanto faltava em `referenciaMs` (hora do servidor).
export interface IRelogio {
  periodo: number;
  restanteMs: number;
  posseMs: number | null;
  rodando: boolean;
  referenciaMs: number;
}

export interface ITimeMesa {
  id: string;
  nome: string;
  logo_url: string | null;
}

export interface IJogadorMesa {
  id: string;
  time_id: string;
  nome: string;
  apelido: string | null;
  numero: number | null;
}

export interface IOficiaisMesa {
  apontador: string;
  cronometrista: string;
  operador_24: string;
  arbitro: string;
  fiscal: string;
}

export interface IMesaContexto {
  jogo: { id: string; competicao_id: string; status: string; fase: string; empatePermitido: boolean };
  competicao: { nome: string } & IRegrasPartida;
  casa: ITimeMesa;
  fora: ITimeMesa;
  jogadores: IJogadorMesa[];
  mesa: IMesa | null;
  lances: ILance[];
}

export interface INovoLance {
  time_id: string;
  jogador_id?: string;
  tipo: TipoLance;
  valor?: number;
  tipo_falta?: TipoFalta;
}

// Operação guardada na fila do aparelho até o servidor confirmar.
export type IOperacaoMesa =
  | { tipo: 'lance'; lance: ILance }
  | { tipo: 'anular'; lanceId: string }
  | { tipo: 'relogio'; relogio: IRelogio };

// Link de mesa ativo de um jogo (só o coordenador vê).
export interface ILinkMesa {
  token: string;
  expira_em: string;
}
