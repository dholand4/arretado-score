import type { IEvento, IEventoInput, IJogoResumo, IMontagemEvento } from '@/@types/event';
import { HORA_INICIO_PADRAO, QTD_JOGOS_PADRAO } from '@/constants/phase';
import type { FormErrors } from './competitionValidators';
import { TIME_ZONE } from './date';
import { pluralize } from './text';

const isoDate = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const hora = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });
// A data do evento é um dia "puro" (sem fuso): formata ao meio-dia UTC para não trocar de dia.
const diaEvento = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function todayInFortaleza(now: Date = new Date()): string {
  return isoDate.format(now);
}

export function formatEventDate(date: string): string {
  return diaEvento.format(new Date(`${date}T12:00:00Z`));
}

export function formatTime(iso: string | null | undefined): string {
  return iso ? hora.format(new Date(iso)) : '—';
}

// "19:00:00" (coluna time) → "19:00".
export function shortTime(value: string): string {
  return value.slice(0, 5);
}

export function teamName(team: IJogoResumo['casa']): string {
  return team?.sigla || team?.nome || '?';
}

export function gameLabel(jogo: IJogoResumo): string {
  return `${jogo.casa?.nome ?? '?'} x ${jogo.fora?.nome ?? '?'}`;
}

export function gameDetails(jogo: IJogoResumo): string {
  const partes = [jogo.fase?.nome];
  if (jogo.grupo) partes.push(`Grupo ${jogo.grupo.nome}`);
  if (jogo.rodada) partes.push(`Rodada ${jogo.rodada}`);
  if (jogo.serie) partes.push(`${jogo.serie.codigo}, jogo ${jogo.numero_na_serie ?? 1}`);
  return partes.filter(Boolean).join(' · ');
}

// Ordem do dia conforme os resultados (mesma regra de reordenar_dia_apos_resultado): quando um jogo
// termina, o próximo é o que menos repete os times dele — vencedor pesa 2, perdedor 1 —, então quem
// perdeu joga em seguida e quem venceu descansa. Antes do resultado, simula as duas saídas do primeiro
// jogo sem placar de cada dia: se o jogo seguinte depende de quem vencer e os dois candidatos têm o
// mesmo adversário, as duas posições viram "Perdedor Jogo N" x C e "Vencedor Jogo N" x C
// (N = número do jogo no dia, o mesmo de dayGameNumbers; espaço inseparável para o N não ficar sozinho na linha).
export interface IGameSides {
  home: string;
  away: string;
}

type IJogoDoDia = Pick<IJogoResumo, 'id' | 'status' | 'evento_id' | 'ordem_no_evento' | 'time_casa_id' | 'time_fora_id' | 'casa' | 'fora'>;

function dependentInDay(dia: IJogoDoDia[], out: Map<string, IGameSides>) {
  const atual = dia.findIndex((j) => j.status === 'agendado');
  if (atual < 0) return;
  const jogo = dia[atual];
  const restantes = dia.map((j, posicao) => ({ j, posicao })).filter(({ j, posicao }) => posicao > atual && j.status === 'agendado');
  if (restantes.length === 0) return;

  const proximo = (vencedor: string) => {
    const peso = (j: IJogoDoDia) =>
      [j.time_casa_id, j.time_fora_id]
        .filter((t) => t === jogo.time_casa_id || t === jogo.time_fora_id)
        .reduce((soma, t) => soma + (t === vencedor ? 2 : 1), 0);
    return restantes.reduce((melhor, item) => (peso(item.j) < peso(melhor.j) ? item : melhor));
  };
  const seCasaVence = proximo(jogo.time_casa_id);
  const seForaVence = proximo(jogo.time_fora_id);
  if (seCasaVence.j.id === seForaVence.j.id) return;

  // Cada candidato tem o perdedor da sua hipótese; o adversário dele precisa ser o mesmo nos dois.
  const adversario = (j: IJogoDoDia, perdedor: string) =>
    j.time_casa_id === perdedor ? j.fora : j.time_fora_id === perdedor ? j.casa : null;
  const advCasaVence = adversario(seCasaVence.j, jogo.time_fora_id);
  const advForaVence = adversario(seForaVence.j, jogo.time_casa_id);
  const proximaPosicao = restantes[0].posicao;
  const posicoes = [seCasaVence.posicao, seForaVence.posicao];
  if (!advCasaVence || advCasaVence.nome !== advForaVence?.nome || !posicoes.includes(proximaPosicao)) return;

  const outraPosicao = posicoes.find((p) => p !== proximaPosicao) as number;
  const doJogo = `Jogo\u00a0${atual + 1}`;
  out.set(dia[proximaPosicao].id, { home: `Perdedor ${doJogo}`, away: advCasaVence.nome });
  out.set(dia[outraPosicao].id, { home: `Vencedor ${doJogo}`, away: advCasaVence.nome });
}

// Jogos (de um ou de vários dias) cujo confronto depende do resultado anterior.
export function dependentGames(jogos: IJogoDoDia[]): Map<string, IGameSides> {
  const out = new Map<string, IGameSides>();
  const dias = new Map<string, IJogoDoDia[]>();
  jogos.forEach((j) => {
    if (j.evento_id) dias.set(j.evento_id, [...(dias.get(j.evento_id) ?? []), j]);
  });
  dias.forEach((dia) => dependentInDay([...dia].sort((a, b) => (a.ordem_no_evento ?? 0) - (b.ordem_no_evento ?? 0)), out));
  return out;
}

// Número de cada jogo no seu dia (1, 2, 3…), pela ordem do dia; só em dias com mais de um jogo.
export function dayGameNumbers(jogos: Pick<IJogoResumo, 'id' | 'evento_id' | 'ordem_no_evento'>[]): Map<string, number> {
  const dias = new Map<string, Pick<IJogoResumo, 'id' | 'ordem_no_evento'>[]>();
  jogos.forEach((j) => {
    if (j.evento_id) dias.set(j.evento_id, [...(dias.get(j.evento_id) ?? []), j]);
  });
  const numeros = new Map<string, number>();
  dias.forEach((dia) => {
    if (dia.length < 2) return;
    [...dia]
      .sort((a, b) => (a.ordem_no_evento ?? 0) - (b.ordem_no_evento ?? 0))
      .forEach((j, i) => numeros.set(j.id, i + 1));
  });
  return numeros;
}

// O que os cartões de jogo precisam saber do dia: confrontos condicionais e número de cada jogo.
// Calcule com todos os jogos da competição, mesmo quando a tela mostra só parte deles.
export interface IDayContext {
  dependentes: Map<string, IGameSides>;
  numeros: Map<string, number>;
}

export function dayContext(jogos: IJogoDoDia[]): IDayContext {
  return { dependentes: dependentGames(jogos), numeros: dayGameNumbers(jogos) };
}

// Os dois lados de um jogo para mostrar: o confronto condicional, se houver, senão os nomes.
export function gameSides(jogo: Pick<IJogoResumo, 'id' | 'casa' | 'fora'>, dependentes?: Map<string, IGameSides>): IGameSides {
  return dependentes?.get(jogo.id) ?? { home: jogo.casa?.nome ?? 'A definir', away: jogo.fora?.nome ?? 'A definir' };
}

// Times que aparecem mais de uma vez no dia (jogo duplo).
export function doubledTeams(jogos: IJogoResumo[]): Set<string> {
  const vezes = new Map<string, number>();
  jogos.forEach((j) => [j.time_casa_id, j.time_fora_id].forEach((t) => vezes.set(t, (vezes.get(t) ?? 0) + 1)));
  return new Set([...vezes].filter(([, n]) => n > 1).map(([t]) => t));
}

export function defaultEventInput(localPadrao: string | null, intervalo: number, hoje = todayInFortaleza()): IEventoInput {
  return {
    data: hoje,
    local: localPadrao ?? '',
    hora_inicio: HORA_INICIO_PADRAO,
    qtd_jogos: QTD_JOGOS_PADRAO,
    intervalo_min: intervalo,
    observacoes: '',
    times: null,
  };
}

// Valores do formulário para editar um dia já montado (a quantidade e os times não mudam na edição).
export function eventToInput(event: IEvento): IEventoInput {
  return {
    data: event.data,
    local: event.local,
    hora_inicio: shortTime(event.hora_inicio),
    qtd_jogos: Math.max(event.jogos.length, 1),
    intervalo_min: event.intervalo_min,
    observacoes: event.observacoes ?? '',
    times: null,
  };
}

export function validateEvent(values: IEventoInput): FormErrors<IEventoInput> {
  const errors: FormErrors<IEventoInput> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.data)) errors.data = 'Informe a data.';
  if (!values.local.trim()) errors.local = 'Informe o local.';
  if (values.times && values.times.length < 2) errors.times = 'Escolha pelo menos 2 times.';
  if (!/^\d{2}:\d{2}/.test(values.hora_inicio)) errors.hora_inicio = 'Informe a hora de início.';
  if (!Number.isInteger(values.qtd_jogos) || values.qtd_jogos < 1) errors.qtd_jogos = 'Informe ao menos 1 jogo.';
  if (!Number.isInteger(values.intervalo_min) || values.intervalo_min < 1) {
    errors.intervalo_min = 'Informe o intervalo em minutos.';
  }
  return errors;
}

// Texto do aviso da seção 6.2.
export function doubleGameMessage(montagem: IMontagemEvento): string {
  const base = `Só é possível montar ${pluralize(montagem.max_sem_repeticao, 'jogo', 'jogos')} sem repetir time. Deseja permitir jogo duplo?`;
  return montagem.candidatos < montagem.pedido
    ? `${base} Há só ${pluralize(montagem.candidatos, 'jogo disponível', 'jogos disponíveis')} no momento.`
    : base;
}

// Aviso depois de montar: menos jogos que o pedido, ou jogo duplo incluído.
export function assemblyNotice(montagem: IMontagemEvento): string | null {
  const montados = montagem.jogos.length;
  if (montados < montagem.pedido) {
    return `Havia só ${pluralize(montados, 'jogo disponível', 'jogos disponíveis')}: o dia foi montado com ${pluralize(montados, 'jogo', 'jogos')} em vez de ${montagem.pedido}.`;
  }
  if (montagem.jogo_duplo) return 'O dia foi montado com jogo duplo: confira a ordem dos jogos.';
  return null;
}

export interface IJogoQueFalta {
  id: string;
  confronto: string;
  detalhe: string;
}

export interface IFaltasDaFase {
  fase: string;
  semDia: IJogoQueFalta[];
  agendados: IJogoQueFalta[];
}

interface IJogoParaFalta {
  id: string;
  fase_id: string;
  status: string;
  rodada: number | null;
  numero_na_serie: number | null;
  casa: { nome: string } | null;
  fora: { nome: string } | null;
  grupo: { nome: string } | null;
  serie: { codigo: string } | null;
}

// Jogos sem resultado das fases em andamento: o que falta para terminar cada fase.
export function remainingGames(
  jogos: IJogoParaFalta[],
  fases: { id: string; nome: string; status: string }[],
): IFaltasDaFase[] {
  return fases
    .filter((fase) => fase.status === 'em_andamento')
    .map((fase) => {
      const abertos = jogos.filter((j) => j.fase_id === fase.id && (j.status === 'pendente' || j.status === 'agendado'));
      const descrever = (j: IJogoParaFalta): IJogoQueFalta => ({
        id: j.id,
        confronto: `${j.casa?.nome ?? 'A definir'} x ${j.fora?.nome ?? 'A definir'}`,
        detalhe: [
          j.grupo && `Grupo ${j.grupo.nome}`,
          j.serie ? `${j.serie.codigo} · Jogo ${j.numero_na_serie}` : j.rodada && `Rodada ${j.rodada}`,
        ]
          .filter(Boolean)
          .join(' · '),
      });
      return {
        fase: fase.nome,
        semDia: abertos.filter((j) => j.status === 'pendente').map(descrever),
        agendados: abertos.filter((j) => j.status === 'agendado').map(descrever),
      };
    });
}
