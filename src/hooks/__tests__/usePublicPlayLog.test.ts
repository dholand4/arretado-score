import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { usePublicPlayLog } from '@/hooks/usePublic';
import { liveSheetService } from '@/services/liveSheetService';
import { createQueryClient } from '@/providers/QueryProvider';
import { createQueryWrapper } from '@/utils/testUtils';

vi.mock('@/services/liveSheetService');
vi.mock('@/services/publicService');
vi.mock('@/services/supabaseService', () => ({ supabase: {} }));

describe('usePublicPlayLog', () => {
  it('loads the plays of a finished game once', async () => {
    const mesa = { lances: [{ id: 'l1' }] };
    vi.mocked(liveSheetService.getContext).mockResolvedValue(mesa as never);
    const { result } = renderHook(() => usePublicPlayLog('j1', true), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.mesa).toEqual(mesa));
    expect(liveSheetService.getContext).toHaveBeenCalledWith('j1');
    expect(liveSheetService.getContext).toHaveBeenCalledTimes(1);
  });

  it('does not query while the game has no result', () => {
    const { result } = renderHook(() => usePublicPlayLog('j1', false), { wrapper: createQueryWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mesa).toBeUndefined();
    expect(liveSheetService.getContext).not.toHaveBeenCalled();
  });

  it('ignores what the live game left in the cache while disabled', () => {
    const client = createQueryClient();
    client.setQueryData(QUERY_KEYS.liveGame('j1'), { lances: [{ id: 'ao-vivo' }] });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => usePublicPlayLog('j1', false), { wrapper });
    expect(result.current.mesa).toBeUndefined();
  });
});
