import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IContatoEquipe, ImageChange, INovoDonoInput, ITimeInput } from '@/@types/competition';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { teamsService } from '@/services/teamsService';
import { usersService } from '@/services/usersService';

export function useTeams(competicaoId: string) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.teams(competicaoId);
  const query = useQuery({ queryKey: key, queryFn: () => teamsService.list(competicaoId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  // Com novoDono, primeiro cria o login do dono (papel dono_time) e o time já nasce vinculado a ele.
  // Com contato, atualiza antes o telefone da equipe já cadastrada.
  const createTeam = useMutation({
    mutationFn: async ({
      input,
      logo,
      novoDono,
      contato,
    }: {
      input: ITimeInput;
      logo: ImageChange;
      novoDono?: INovoDonoInput;
      contato?: IContatoEquipe;
    }) => {
      if (contato) await usersService.update(contato);
      const donoId = novoDono ? (await usersService.create({ ...novoDono, papel: 'dono_time' })).id : input.dono_id;
      return teamsService.create(competicaoId, { ...input, dono_id: donoId }, logo);
    },
    onSuccess: () => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.donos });
    },
  });
  const removeTeam = useMutation({ mutationFn: teamsService.remove, onSuccess: invalidate });

  return {
    teams: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    createTeam,
    removeTeam,
  };
}

export function useTeam(timeId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEYS.team(timeId), queryFn: () => teamsService.get(timeId) });

  // Com novoDono, cria o login da equipe e vincula ao time na mesma ação; com contato, troca o telefone dela.
  const updateTeam = useMutation({
    mutationFn: async ({
      patch,
      logo,
      novoDono,
      contato,
    }: {
      patch: Partial<ITimeInput>;
      logo: ImageChange;
      novoDono?: INovoDonoInput;
      contato?: IContatoEquipe;
    }) => {
      if (!query.data) throw new Error('Time não carregado.');
      if (contato) await usersService.update(contato);
      const donoId = novoDono ? (await usersService.create({ ...novoDono, papel: 'dono_time' })).id : patch.dono_id;
      return teamsService.update(timeId, query.data.competicao_id, { ...patch, dono_id: donoId }, logo);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.team(timeId) });
      if (query.data) void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams(query.data.competicao_id) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.donos });
      void queryClient.invalidateQueries({ queryKey: ['my-teams'] });
    },
  });

  return { team: query.data, isLoading: query.isPending, error: query.error, refetch: query.refetch, updateTeam };
}

// Nome e competição do time para o menu lateral; não busca nada fora da página de um time.
export function useTeamSummary(timeId: string | undefined) {
  const query = useQuery({
    queryKey: QUERY_KEYS.team(timeId ?? ''),
    queryFn: () => teamsService.get(timeId ?? ''),
    enabled: Boolean(timeId),
  });
  return { team: timeId ? query.data : undefined };
}

export function useMyTeams(userId: string) {
  const query = useQuery({ queryKey: QUERY_KEYS.myTeams(userId), queryFn: () => teamsService.listMine(userId) });
  return { teams: query.data ?? [], isLoading: query.isPending, error: query.error, refetch: query.refetch };
}
