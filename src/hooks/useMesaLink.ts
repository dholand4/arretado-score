import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IMesa } from '@/@types/liveSheet';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { liveSheetService } from '@/services/liveSheetService';

// Link de mesa do jogo (coordenador): ver o ativo, gerar um novo (o anterior deixa de valer) e cancelar.
export function useMesaLink(jogoId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.mesaLink(jogoId);
  const query = useQuery({ queryKey: key, queryFn: () => liveSheetService.activeLink(jogoId), enabled });
  const atualizar = () => queryClient.invalidateQueries({ queryKey: key });
  const gerar = useMutation({ mutationFn: () => liveSheetService.createLink(jogoId), onSuccess: atualizar });
  const cancelar = useMutation({ mutationFn: () => liveSheetService.cancelLink(jogoId), onSuccess: atualizar });
  return { link: query.data ?? null, isLoading: enabled && query.isPending, error: query.error, gerar, cancelar };
}

// Mesário abrindo o link: descobre o jogo (e a liga) do link; sem repetir se o link não vale.
export function useMesaByToken(token: string) {
  const query = useQuery({
    queryKey: ['mesa-link', token],
    queryFn: () => liveSheetService.byToken(token),
    retry: false,
  });
  return { jogo: query.data ?? null, isLoading: query.isPending, error: query.error, refetch: query.refetch };
}

// Mesas abertas ou aguardando aprovação na competição (lista de jogos do coordenador).
export function useOpenMesas(competicaoId: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.openMesas(competicaoId),
    queryFn: () => liveSheetService.openStatuses(competicaoId),
  });
  return query.data ?? new Map<string, IMesa['status']>();
}
