import { useState } from 'react';
import type { IEvento, IEventoInput, IMontagemEvento } from '@/@types/event';
import { AlertGlobal, type AlertVariant } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ConfirmDialogGlobal } from '@/components/confirmDialogGlobal';
import { DoubleGameDialogGlobal } from '@/components/doubleGameDialogGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { EventCardGlobal } from '@/components/eventCardGlobal';
import { EventFormModalGlobal } from '@/components/eventFormModalGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { RemainingGamesGlobal } from '@/components/remainingGamesGlobal';
import { SwapGameModalGlobal } from '@/components/swapGameModalGlobal';
import { useCompetition } from '@/hooks/useCompetitions';
import { useEventCandidates, useEvents } from '@/hooks/useEvents';
import { useGames } from '@/hooks/useGames';
import { useTeams } from '@/hooks/useTeams';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useConfirmAction } from '@/hooks/useConfirm';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import {
  assemblyNotice,
  defaultEventInput,
  doubleGameMessage,
  eventToInput,
  formatEventDate,
  remainingGames,
} from '@/utils/eventSchedule';
import { Feedback, List } from './style';

// Montagem aguardando a confirmação de jogo duplo (seção 6.2).
type PendingAssembly =
  | { kind: 'create'; input: IEventoInput; montagem: IMontagemEvento }
  | { kind: 'redraw'; eventoId: string; montagem: IMontagemEvento };

type Confirmation = { kind: 'publish' | 'delete' | 'redraw'; event: IEvento };

const CONFIRM_TEXT: Record<Confirmation['kind'], { title: string; message: string; label: string }> = {
  publish: {
    title: 'Publicar o dia',
    message: 'Depois de publicado, o dia e os jogos aparecem na área pública e não podem mais ser remontados.',
    label: 'Publicar',
  },
  delete: {
    title: 'Excluir o dia',
    message: 'Os jogos sem súmula voltam a ficar pendentes, sem dia. Deseja excluir?',
    label: 'Excluir',
  },
  redraw: {
    title: 'Sortear de novo',
    message: 'Os jogos atuais voltam a ficar pendentes e o sistema monta o dia outra vez. Deseja continuar?',
    label: 'Sortear de novo',
  },
};

export function EventsScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const {
    competition,
    isLoading: loadingCompetition,
    error: competitionError,
    refetch: refetchCompetition,
  } = useCompetition(competitionId);
  const {
    events,
    isLoading,
    error,
    refetch,
    createEvent,
    redrawEvent,
    reorderEvent,
    swapGame,
    removeGame,
    updateEvent,
    publishEvent,
    deleteEvent,
  } = useEvents(competitionId);
  const [formOpen, setFormOpen] = useState(false);
  const [pending, setPending] = useState<PendingAssembly | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [swapEvent, setSwapEvent] = useState<IEvento | null>(null);
  // Dia em edição (data, hora, local, intervalo e observações).
  const [editingEvent, setEditingEvent] = useState<IEvento | null>(null);
  const [feedback, setFeedback] = useState<{ variant: AlertVariant; message: string } | null>(null);
  const askConfirm = useConfirmAction();
  const { candidates, isLoading: loadingCandidates } = useEventCandidates(
    competitionId,
    Boolean(swapEvent) || formOpen,
  );
  const { teams } = useTeams(competitionId);
  const { jogos, fases } = useGames(competitionId);
  const faltas = remainingGames(jogos, fases);

  const busy =
    redrawEvent.isPending ||
    reorderEvent.isPending ||
    swapGame.isPending ||
    removeGame.isPending ||
    publishEvent.isPending ||
    deleteEvent.isPending;

  const showError = (err: unknown) => setFeedback({ variant: 'error', message: getErrorMessage(err) });
  const assembled = (montagem: IMontagemEvento, success: string) => {
    setPending(null);
    setFormOpen(false);
    const notice = assemblyNotice(montagem);
    setFeedback(notice ? { variant: 'warning', message: notice } : { variant: 'success', message: success });
  };

  const create = (input: IEventoInput, permitirDuplo: boolean) =>
    askConfirm(`Lançar os jogos de ${formatEventDate(input.data)}?`, () =>
      createEvent.mutate(
        { input, permitirDuplo },
        {
          onSuccess: (montagem) =>
            montagem.precisa_confirmar
              ? setPending({ kind: 'create', input, montagem })
              : assembled(
                  montagem,
                  'Jogos lançados em rascunho. Confira a ordem e publique para aparecerem ao público.',
                ),
        },
      ),
    );

  const redraw = (eventoId: string, permitirDuplo: boolean, qtdJogos?: number) =>
    redrawEvent.mutate(
      { eventoId, permitirDuplo, qtdJogos },
      {
        onSuccess: (montagem) => {
          setConfirmation(null);
          if (montagem.precisa_confirmar) setPending({ kind: 'redraw', eventoId, montagem });
          else assembled(montagem, 'Jogos do dia sorteados de novo.');
        },
        onError: (err) => {
          setConfirmation(null);
          showError(err);
        },
      },
    );

  const resolvePending = (allowDouble: boolean) => {
    if (!pending) return;
    const limit = allowDouble ? undefined : pending.montagem.max_sem_repeticao;
    if (pending.kind === 'create') {
      create(limit ? { ...pending.input, qtd_jogos: limit } : pending.input, allowDouble);
    } else {
      redraw(pending.eventoId, allowDouble, limit);
    }
  };

  const confirmAction = () => {
    if (!confirmation) return;
    const { kind, event } = confirmation;
    if (kind === 'redraw') {
      redraw(event.id, false);
      return;
    }
    const mutation = kind === 'publish' ? publishEvent : deleteEvent;
    mutation.mutate(event.id, {
      onSuccess: () => {
        setConfirmation(null);
        setFeedback({
          variant: 'success',
          message:
            kind === 'publish'
              ? 'Jogos publicados: já aparecem para quem acompanha a liga.'
              : 'Dia excluído; os jogos voltaram para a lista de jogos que faltam.',
        });
      },
    });
  };

  const openCreate = () => {
    createEvent.reset();
    setFeedback(null);
    setFormOpen(true);
  };

  const renderContent = () => {
    if (loadingCompetition || isLoading) return <LoaderGlobal label="Carregando jogos lançados" />;
    if (competitionError || !competition) {
      return <ErrorStateGlobal error={competitionError} onRetry={() => void refetchCompetition()} />;
    }
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (competition.status === 'rascunho') {
      return (
        <EmptyStateGlobal
          title="Competição ainda não iniciada"
          description="Inicie a competição na visão geral: os jogos da primeira fase são gerados e aí é possível montar os dias."
          action={<LinkButtonGlobal to={paths.competition(competitionId)} label="Ir para a visão geral" />}
        />
      );
    }
    if (events.length === 0) {
      return (
        <List>
          <RemainingGamesGlobal phases={faltas} />
          <EmptyStateGlobal
            title="Nenhum jogo lançado"
            description="Escolha a data e os times que vão jogar; o sistema monta o dia com os jogos que faltam entre eles."
            action={<ButtonGlobal label="Lançar jogos" onClick={openCreate} />}
          />
        </List>
      );
    }
    return (
      <List>
        <RemainingGamesGlobal phases={faltas} />
        {events.map((event) => (
          <EventCardGlobal
            key={event.id}
            event={event}
            busy={busy}
            onReorder={(jogoIds) =>
              askConfirm('Mudar a ordem dos jogos deste dia?', () =>
                reorderEvent.mutate({ eventoId: event.id, jogoIds }, { onError: showError }),
              )
            }
            onRemoveGame={(jogoId) =>
              askConfirm('Tirar este jogo do dia? Ele volta para os jogos que faltam.', () =>
                removeGame.mutate(jogoId, { onError: showError }),
              )
            }
            onSwap={() => {
              swapGame.reset();
              setSwapEvent(event);
            }}
            onRedraw={() => setConfirmation({ kind: 'redraw', event })}
            onPublish={() => {
              publishEvent.reset();
              setConfirmation({ kind: 'publish', event });
            }}
            onEdit={() => {
              updateEvent.reset();
              setEditingEvent(event);
            }}
            onDelete={() => {
              deleteEvent.reset();
              setConfirmation({ kind: 'delete', event });
            }}
          />
        ))}
      </List>
    );
  };

  const confirmText = confirmation ? CONFIRM_TEXT[confirmation.kind] : null;
  const confirmMutation =
    confirmation?.kind === 'publish' ? publishEvent : confirmation?.kind === 'delete' ? deleteEvent : redrawEvent;
  const pendingMutation = pending?.kind === 'redraw' ? redrawEvent : createEvent;

  return (
    <>
      <PageHeaderGlobal
        title="Lançar jogos"
        actions={
          competition?.status === 'em_andamento' && events.length > 0 ? (
            <ButtonGlobal label="Lançar jogos" onClick={openCreate} />
          ) : undefined
        }
      />
      {feedback && (
        <Feedback>
          <AlertGlobal variant={feedback.variant} message={feedback.message} onClose={() => setFeedback(null)} />
        </Feedback>
      )}
      {renderContent()}

      {formOpen && competition && (
        <EventFormModalGlobal
          open={!pending}
          initialValues={defaultEventInput(competition.local_padrao, competition.intervalo_jogos_min)}
          teams={teams.map((t) => ({ id: t.id, nome: t.nome }))}
          missingGames={candidates.map((jogo) => ({
            id: jogo.id,
            timeCasaId: jogo.time_casa_id,
            timeForaId: jogo.time_fora_id,
            confronto: `${jogo.casa?.nome ?? 'A definir'} x ${jogo.fora?.nome ?? 'A definir'}`,
          }))}
          saving={createEvent.isPending}
          error={createEvent.error ? getErrorMessage(createEvent.error) : null}
          onSubmit={(input) => create(input, false)}
          onClose={() => setFormOpen(false)}
        />
      )}

      {editingEvent && (
        <EventFormModalGlobal
          open
          mode="edit"
          initialValues={eventToInput(editingEvent)}
          saving={updateEvent.isPending}
          error={updateEvent.error ? getErrorMessage(updateEvent.error) : null}
          onSubmit={(input) =>
            updateEvent.mutate(
              { eventoId: editingEvent.id, input },
              {
                onSuccess: () => {
                  setEditingEvent(null);
                  setFeedback({ variant: 'success', message: `Dia de jogos atualizado: ${formatEventDate(input.data)}.` });
                },
              },
            )
          }
          onClose={() => setEditingEvent(null)}
        />
      )}

      <DoubleGameDialogGlobal
        open={Boolean(pending)}
        message={pending ? doubleGameMessage(pending.montagem) : ''}
        maxWithoutRepeat={pending?.montagem.max_sem_repeticao ?? 0}
        loading={pendingMutation.isPending}
        error={pendingMutation.error ? getErrorMessage(pendingMutation.error) : null}
        onAllowDouble={() => resolvePending(true)}
        onLimit={() => resolvePending(false)}
        onClose={() => setPending(null)}
      />

      {confirmation && confirmText && (
        <ConfirmDialogGlobal
          open
          title={`${confirmText.title} — ${formatEventDate(confirmation.event.data)}`}
          message={confirmText.message}
          confirmLabel={confirmText.label}
          danger={confirmation.kind === 'delete'}
          loading={confirmMutation.isPending}
          error={confirmMutation.error ? getErrorMessage(confirmMutation.error) : null}
          onConfirm={confirmAction}
          onClose={() => setConfirmation(null)}
        />
      )}

      {swapEvent && (
        <SwapGameModalGlobal
          open
          games={swapEvent.jogos}
          candidates={candidates}
          loadingCandidates={loadingCandidates}
          saving={swapGame.isPending}
          error={swapGame.error ? getErrorMessage(swapGame.error) : null}
          onConfirm={(saiId, entraId) =>
            swapGame.mutate(
              { saiId, entraId },
              {
                onSuccess: () => {
                  setSwapEvent(null);
                  setFeedback({ variant: 'success', message: 'Jogo trocado.' });
                },
              },
            )
          }
          onClose={() => setSwapEvent(null)}
        />
      )}
    </>
  );
}
