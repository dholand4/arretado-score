import type { Tables } from './database';

export type TipoFase = 'todos_contra_todos' | 'grupos' | 'mata_mata';
export type Cruzamento = 'por_campanha' | 'cruzado_grupos' | 'vencedores' | 'manual';
export type SorteioGrupos = 'aleatorio' | 'manual';
export type StatusFase = 'aguardando' | 'em_andamento' | 'concluida';
export type MelhorDe = 1 | 3 | 5 | 7;

// Origem de um lado da série (seção 4.4 / 4.4.1).
export type IOrigem =
  | { tipo: 'posicao'; fase_ordem: number; posicao: number }
  | { tipo: 'posicao_grupo'; fase_ordem: number; grupo: string; posicao: number }
  | { tipo: 'melhor_extra'; fase_ordem: number; posicao: number }
  | { tipo: 'vencedor'; serie: string }
  | { tipo: 'perdedor'; serie: string };

export interface IConfronto {
  origem_a: IOrigem | null;
  origem_b: IOrigem | null;
}

// Uma fase no formulário do assistente (etapa "Fases").
export interface IFaseForm {
  key: string;
  nome: string;
  tipo: TipoFase;
  turnos: 1 | 2;
  qtd_grupos: number | null;
  sorteio_grupos: SorteioGrupos;
  classificam: number | null;
  melhores_extras: number;
  melhor_de: MelhorDe;
  cruzamento: Cruzamento | null;
  disputa_terceiro: boolean;
  confrontos: IConfronto[];
  // Fase que já começou: só nome e classificados podem mudar.
  iniciada: boolean;
}

// Corpo enviado à RPC salvar_fases.
export interface IFasePayload {
  nome: string;
  tipo: TipoFase;
  turnos: number;
  qtd_grupos: number | null;
  sorteio_grupos: SorteioGrupos;
  classificam: number | null;
  melhores_extras: number;
  melhor_de: number;
  cruzamento: Cruzamento | null;
  disputa_terceiro: boolean;
  confrontos?: { origem_a: IOrigem; origem_b: IOrigem }[];
}

export interface ISerieConfig {
  codigo: string;
  origem_a: IOrigem;
  origem_b: IOrigem;
  terceiro: boolean;
}

export type ISerie = Omit<Tables<'series'>, 'origem_a' | 'origem_b' | 'status'> & {
  origem_a: IOrigem | null;
  origem_b: IOrigem | null;
  status: StatusFase;
};

export interface IGrupoComTimes {
  id: string;
  nome: string;
  grupo_times: { time_id: string; time: { nome: string } | null }[];
}

export type IFase = Omit<Tables<'fases'>, 'tipo' | 'cruzamento' | 'sorteio_grupos' | 'status'> & {
  tipo: TipoFase;
  cruzamento: Cruzamento | null;
  sorteio_grupos: SorteioGrupos;
  status: StatusFase;
  series: ISerie[];
  grupos: IGrupoComTimes[];
};

// Distribuição manual dos grupos: { A: [time_id…], B: […] }.
export type IDistribuicaoGrupos = Record<string, string[]>;

export interface IPhaseIssue {
  phaseIndex: number | null;
  field?: keyof IFaseForm | 'confrontos';
  message: string;
}

export interface IPhaseValidation {
  errors: IPhaseIssue[];
  warnings: IPhaseIssue[];
}

export interface ISummaryStep {
  kind: 'fase' | 'transicao';
  label: string;
}
