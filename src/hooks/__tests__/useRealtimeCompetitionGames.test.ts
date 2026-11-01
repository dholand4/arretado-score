import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { useRealtimeCompetitionGames } from '@/hooks/useGames';

const handlers: (() => void)[] = [];
const removeChannel = vi.fn();
vi.mock('@/services/supabaseService', () => {
  const canal = {
    on: (_tipo: string, _filtro: unknown, handler: () => void) => {
      handlers.push(handler);
      return canal;
    },
    subscribe: () => canal,
  };
  return { supabase: { channel: () => canal, removeChannel: (c: unknown) => removeChannel(c) } };
});

describe('useRealtimeCompetitionGames', () => {
  it('refreshes games, score sheets and standings when a game changes elsewhere', () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { unmount } = renderHook(() => useRealtimeCompetitionGames('c1'), { wrapper });

    handlers[0]();
    const keys = invalidate.mock.calls.map(([filtro]) => filtro?.queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([['competitions', 'c1', 'games'], ['games'], ['classification'], ['competitions', 'c1', 'events']]),
    );

    unmount();
    expect(removeChannel).toHaveBeenCalled();
  });
});
