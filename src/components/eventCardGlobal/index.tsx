import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { OrderListGlobal } from '@/components/orderListGlobal';
import { STATUS_EVENTO, STATUS_JOGO } from '@/constants/phase';
import {
  dependentGames,
  doubledTeams,
  formatEventDate,
  formatTime,
  gameDetails,
  gameSides,
  shortTime,
} from '@/utils/eventSchedule';
import { pluralize } from '@/utils/text';
import { Actions, Details, Game, Games, Meta, Texts, Time } from './style';
import type { IEventCardProps } from './types';

// Um dia de jogos: em rascunho pode ser reordenado (arrastar ou ↑/↓), trocado, sorteado de novo e publicado.
export function EventCardGlobal({
  event,
  busy = false,
  onReorder,
  onRemoveGame,
  onSwap,
  onRedraw,
  onPublish,
  onEdit,
  onDelete,
  onGenerateArt,
}: IEventCardProps) {
  const status = STATUS_EVENTO[event.status];
  const draft = event.status === 'rascunho';
  const duplos = doubledTeams(event.jogos);
  // Confrontos que dependem do resultado anterior ("Perdedor do 1º jogo x C") mostram só a fase.
  const dependentes = dependentGames(event.jogos);
  const label = (j: (typeof event.jogos)[number]) => {
    const lados = gameSides(j, dependentes);
    return `${lados.home} x ${lados.away}`;
  };
  const details = (j: (typeof event.jogos)[number]) => (dependentes.has(j.id) ? (j.fase?.nome ?? '') : gameDetails(j));
  const describe = (j: (typeof event.jogos)[number]) => {
    const extras = [formatTime(j.inicio_previsto), details(j)];
    if (duplos.has(j.time_casa_id) || duplos.has(j.time_fora_id)) extras.push('jogo duplo');
    if (j.status !== 'agendado') extras.push(STATUS_JOGO[j.status]);
    return extras.join(' · ');
  };

  return (
    <CardGlobal
      as="article"
      title={`${formatEventDate(event.data)} · ${shortTime(event.hora_inicio)}`}
      actions={<BadgeGlobal label={status.label} tone={status.tone} />}
    >
      <Meta>
        {event.local} · intervalo de {event.intervalo_min} min · {pluralize(event.jogos.length, 'jogo', 'jogos')}
        {event.jogos.length !== event.qtd_jogos && ` (pedido: ${event.qtd_jogos})`}
      </Meta>
      {event.observacoes && <Meta>{event.observacoes}</Meta>}
      {duplos.size > 0 && (
        <Meta>
          A ordem se ajusta aos resultados: a cada jogo encerrado, quem perdeu joga em seguida e quem venceu descansa.
        </Meta>
      )}

      {event.jogos.length === 0 && <Meta>Nenhum jogo neste dia. Use “Sortear de novo” para montar.</Meta>}
      {draft && event.jogos.length > 0 && (
        <OrderListGlobal
          ariaLabel={`Jogos de ${formatEventDate(event.data)}`}
          items={event.jogos.map((j) => ({ id: j.id, label: label(j), description: describe(j) }))}
          onChange={onReorder}
          onRemove={onRemoveGame}
          disabled={busy}
        />
      )}
      {!draft && event.jogos.length > 0 && (
        <Games aria-label={`Jogos de ${formatEventDate(event.data)}`}>
          {event.jogos.map((j) => (
            <Game key={j.id}>
              <Time>{formatTime(j.inicio_previsto)}</Time>
              <Texts>
                <span>{label(j)}</span>
                <Details>{details(j)}</Details>
              </Texts>
            </Game>
          ))}
        </Games>
      )}

      <Actions>
        {draft && (
          <>
            <ButtonGlobal label="Trocar jogo" size="sm" variant="outline" disabled={busy || event.jogos.length === 0} onClick={onSwap} />
            <ButtonGlobal label="Sortear de novo" size="sm" variant="outline" disabled={busy} onClick={onRedraw} />
            <ButtonGlobal label="Publicar" size="sm" disabled={busy || event.jogos.length === 0} onClick={onPublish} />
          </>
        )}
        {!draft && event.jogos.length > 0 && onGenerateArt && (
          <ButtonGlobal label="Gerar Arte" size="sm" onClick={onGenerateArt} />
        )}
        <ButtonGlobal label="Editar dia" size="sm" variant="outline" disabled={busy} onClick={onEdit} />
        <ButtonGlobal label="Excluir" size="sm" variant="ghost" disabled={busy} onClick={onDelete} />
      </Actions>
    </CardGlobal>
  );
}

export type { IEventCardProps } from './types';
