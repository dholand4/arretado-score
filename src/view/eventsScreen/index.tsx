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
import { SwapGameModalGlobal } from '@/components/swapGameModalGlobal';
import { useCompetition } from '@/hooks/useCompetitions';
import { useEventCandidates, useEvents } from '@/hooks/useEvents';
import { useRouteParams } from '@/hooks/useRouteParams';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { assemblyNotice, defaultEventInput, doubleGameMessage, formatEventDate } from '@/utils/eventSchedule';
import { Feedback, List } from './style';

// Montagem aguardando a confirmação de jogo duplo (seção 6.2).
type PendingAssembly =
  | { kind: 'create'; input: IEventoInput; montagem: IMontagemEvento }
  | { kind: 'redraw'; eventoId: string; montagem: IMontagemEvento };

type Confirmation = { kind: 'publish' | 'delete' | 'redraw'; event: IEvento };

const CONFIRM_TEXT: Record<Confirmation['kind'], { title: string; message: string; label: string }> = {
  publish: {
    title: 'Publicar dia de jogos',
    message: 'Depois de publicado, o dia e os jogos aparecem na área pública e não podem mais ser remontados.',
    label: 'Publicar',
  },
  delete: {
    title: 'Excluir dia de jogos',
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
  const { competition, isLoading: loadingCompetition, error: competitionError, refetch: refetchCompetition } =
    useCompetition(competitionId);
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
    publishEvent,
    deleteEvent,
  } = useEvents(competitionId);
  const [formOpen, setFormOpen] = useState(false);
  const [pending, setPending] = useState<PendingAssembly | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [swapEvent, setSwapEvent] = useState<IEvento | null>(null);
  const [feedback, setFeedback] = useState<{ variant: AlertVariant; message: string } | null>(null);
  const { candidates, isLoading: loadingCandidates } = useEventCandidates(competitionId, Boolean(swapEvent));

  const busy =
    redrawEvent.isPending || reorderEvent.isPending || swapGame.isPending || removeGame.isPending ||
    publishEvent.isPending || deleteEvent.isPending;

  const showError = (err: unknown) => setFeedback({ variant: 'error', message: getErrorMessage(err) });
  const assembled = (montagem: IMontagemEvento, success: string) => {
    setPending(null);
    setFormOpen(false);
    const notice = assemblyNotice(montagem);
    setFeedback(notice ? { variant: 'warning', message: notice } : { variant: 'success', message: success });
  };

  const create = (input: IEventoInput, permitirDuplo: boolean) =>
    createEvent.mutate(
      { input, permitirDuplo },
      {
        onSuccess: (montagem) =>
          montagem.precisa_confirmar
            ? setPending({ kind: 'create', input, montagem })
            : assembled(montagem, 'Dia de jogos montado em rascunho. Confira a ordem e publique.'),
      },
    );

  const redraw = (eventoId: string, permitirDuplo: boolean, qtdJogos?: number) =>
    redrawEvent.mutate(
      { eventoId, permitirDuplo, qtdJogos },
      {
        onSuccess: (montagem) => {
          setConfirmation(null);
          if (montagem.precisa_confirmar) setPending({ kind: 'redraw', eventoId, montagem });
          else assembled(montagem, 'Dia de jogos sorteado de novo.');
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
          message: kind === 'publish' ? 'Dia de jogos publicado.' : 'Dia de jogos excluído; os jogos voltaram a ficar pendentes.',
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
    if (loadingCompetition || isLoading) return <LoaderGlobal label="Carregando dias de jogos" />;
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
        <EmptyStateGlobal
          title="Nenhum dia de jogos"
          description="Crie um dia informando data, hora e quantidade de jogos; o sistema sorteia os confrontos."
          action={<ButtonGlobal label="Novo dia de jogos" onClick={openCreate} />}
        />
      );
    }
    return (
      <List>
        {events.map((event) => (
          <EventCardGlobal
            key={event.id}
            event={event}
            busy={busy}
            onReorder={(jogoIds) => reorderEvent.mutate({ eventoId: event.id, jogoIds }, { onError: showError })}
            onRemoveGame={(jogoId) => removeGame.mutate(jogoId, { onError: showError })}
            onSwap={() => {
              swapGame.reset();
              setSwapEvent(event);
            }}
            onRedraw={() => setConfirmation({ kind: 'redraw', event })}
            onPublish={() => {
              publishEvent.reset();
              setConfirmation({ kind: 'publish', event });
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
  const confirmMutation = confirmation?.kind === 'publish' ? publishEvent : confirmation?.kind === 'delete' ? deleteEvent : redrawEvent;
  const pendingMutation = pending?.kind === 'redraw' ? redrawEvent : createEvent;

  return (
    <>
      <PageHeaderGlobal
        title="Dias de jogos"
        subtitle={competition?.nome}
        actions={
          competition?.status === 'em_andamento' && events.length > 0 ? (
            <ButtonGlobal label="Novo dia de jogos" onClick={openCreate} />
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
          saving={createEvent.isPending}
          error={createEvent.error ? getErrorMessage(createEvent.error) : null}
          onSubmit={(input) => create(input, false)}
          onClose={() => setFormOpen(false)}
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
