import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { bracketService } from '@/services/bracketService';
import { usePublicBracket } from '../usePublicBracket';

vi.mock('@/services/bracketService', () => ({ bracketService: { load: vi.fn() } }));
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;

describe('usePublicBracket', () => {
  it('resolve origens pendentes e campeão', async () => {
    vi.mocked(bracketService.load).mockResolvedValue({
      competition: { id: 'c', nome: 'Liga', status: 'encerrada' },
      phases: [{ id: 'f', nome: 'Final', ordem: 2, disputa_terceiro: false }],
      teams: [{ id: 't', nome: 'Tubarões' }], games: [],
      series: [{ id: 's', fase_id: 'f', codigo: 'S1', origem_a: { tipo: 'vencedor', serie: 'S0' }, origem_b: { tipo: 'posicao', fase_ordem: 1, posicao: 4 }, time_a_id: 't', time_b_id: null, vencedor_id: 't', melhor_de: 3, vitorias_a: 2, vitorias_b: 0, status: 'concluida', created_at: '' }],
    });
    const { result } = renderHook(() => usePublicBracket('liga'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.phases[0].series[0].nameB).toBe('4º colocado da Fase 1');
    expect(result.current.champion).toBe('Tubarões');
  });
  it('expõe erro do carregamento', async () => {
    vi.mocked(bracketService.load).mockRejectedValue(new Error('Falha'));
    const { result } = renderHook(() => usePublicBracket('falha'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
