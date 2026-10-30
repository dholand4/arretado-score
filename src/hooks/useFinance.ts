import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ICobranca, IMarcarPagoInput, StatusCobranca } from '@/@types/finance';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { financeService } from '@/services/financeService';

export function useFinance(competicaoId: string) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.charges(competicaoId);
  const query = useQuery({ queryKey: key, queryFn: () => financeService.listCharges(competicaoId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const generate = useMutation({ mutationFn: () => financeService.generateCharges(competicaoId), onSuccess: invalidate });
  const markPaid = useMutation({
    mutationFn: ({ cobranca, input }: { cobranca: ICobranca; input: IMarcarPagoInput }) =>
      financeService.markPaid(cobranca, input),
    onSuccess: invalidate,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<StatusCobranca, 'pago'> }) =>
      financeService.setStatus(id, status),
    onSuccess: invalidate,
  });
  const openReceipt = useMutation({ mutationFn: financeService.receiptUrl });

  return {
    cobrancas: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    generate,
    markPaid,
    setStatus,
    openReceipt,
  };
}

export function useTeamPayments(timeId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const key = QUERY_KEYS.teamPayments(timeId);
  const query = useQuery({ queryKey: key, queryFn: () => financeService.listTeamPayments(timeId), enabled });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const generate = useMutation({
    mutationFn: ({ referencia, valor }: { referencia: string; valor: number }) =>
      financeService.generateTeamPayments(timeId, referencia, valor),
    onSuccess: invalidate,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusCobranca }) => financeService.setTeamPaymentStatus(id, status),
    onSuccess: invalidate,
  });

  return {
    pagamentos: query.data ?? [],
    isLoading: enabled && query.isPending,
    error: query.error,
    refetch: query.refetch,
    generate,
    setStatus,
  };
}
