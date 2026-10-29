import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IJogador, IJogadorInput, ImageChange, ITime } from '@/@types/competition';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { playersService } from '@/services/teamsService';

export function usePlayers(time: Pick<ITime, 'id' | 'competicao_id'>) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.players(time.id);
  const query = useQuery({ queryKey: key, queryFn: () => playersService.list(time.id) });
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams(time.competicao_id) });
  };

  const savePlayer = useMutation({
    mutationFn: ({ jogador, input, photo }: { jogador?: IJogador; input: IJogadorInput; photo: ImageChange }) =>
      jogador ? playersService.update(jogador, input, photo) : playersService.create(time, input, photo),
    onSuccess: invalidate,
  });
  const setPlayerActive = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => playersService.setActive(id, ativo),
    onSuccess: invalidate,
  });
  const removePlayer = useMutation({ mutationFn: playersService.remove, onSuccess: invalidate });

  return {
    players: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    savePlayer,
    setPlayerActive,
    removePlayer,
  };
}
