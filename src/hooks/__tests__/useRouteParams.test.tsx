import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useRouteParams } from '@/hooks/useRouteParams';

const at = (path: string, pattern: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={pattern} element={children} />
        </Routes>
      </MemoryRouter>
    );
  };

describe('useRouteParams', () => {
  it('returns typed params', () => {
    const { result } = renderHook(() => useRouteParams('competitionId', 'teamId'), {
      wrapper: at('/c/1/t/2', '/c/:competitionId/t/:teamId'),
    });
    expect(result.current).toEqual({ competitionId: '1', teamId: '2' });
  });

  it('throws when a param is missing', () => {
    expect(() =>
      renderHook(() => useRouteParams('teamId'), { wrapper: at('/c/1', '/c/:competitionId') }),
    ).toThrow(/teamId/);
  });
});
