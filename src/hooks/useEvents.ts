import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IEventoInput } from '@/@types/event';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { eventsService } from '@/services/eventsService';

// Dias de jogos da competição e as ações de montagem (seção 6.2).
export function useEvents(competicaoId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEYS.events(competicaoId), queryFn: () => eventsService.list(competicaoId) });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events(competicaoId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.eventCandidates(competicaoId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gamesProgress(competicaoId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.games(competicaoId) });
  };

  const createEvent = useMutation({
    mutationFn: ({ input, permitirDuplo }: { input: IEventoInput; permitirDuplo: boolean }) =>
      eventsService.create(competicaoId, input, permitirDuplo),
    onSuccess: (result) => {
      if (!result.precisa_confirmar) invalidate();
    },
  });
  const redrawEvent = useMutation({
    mutationFn: ({ eventoId, permitirDuplo, qtdJogos }: { eventoId: string; permitirDuplo: boolean; qtdJogos?: number }) =>
      eventsService.redraw(eventoId, permitirDuplo, qtdJogos),
    onSuccess: (result) => {
      if (!result.precisa_confirmar) invalidate();
    },
  });
  const reorderEvent = useMutation({
    mutationFn: ({ eventoId, jogoIds }: { eventoId: string; jogoIds: string[] }) =>
      eventsService.reorder(eventoId, jogoIds),
    onSettled: invalidate,
  });
  const swapGame = useMutation({
    mutationFn: ({ saiId, entraId }: { saiId: string; entraId: string }) => eventsService.swapGame(saiId, entraId),
    onSuccess: invalidate,
  });
  const removeGame = useMutation({ mutationFn: eventsService.removeGame, onSuccess: invalidate });
  const publishEvent = useMutation({ mutationFn: eventsService.publish, onSuccess: invalidate });
  const deleteEvent = useMutation({ mutationFn: eventsService.remove, onSuccess: invalidate });

  return {
    events: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    createEvent,
    redrawEvent,
    reorderEvent,
    swapGame,
    removeGame,
    publishEvent,
    deleteEvent,
  };
}

export function useEventCandidates(competicaoId: string, enabled: boolean) {
  const query = useQuery({
    queryKey: QUERY_KEYS.eventCandidates(competicaoId),
    queryFn: () => eventsService.listCandidates(competicaoId),
    enabled,
  });
  return { candidates: query.data ?? [], isLoading: enabled && query.isPending, error: query.error };
}
