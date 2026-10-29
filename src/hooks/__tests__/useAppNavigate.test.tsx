import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useAppNavigate } from '@/hooks/useAppNavigate';

describe('useAppNavigate', () => {
  it('navigates to a typed route', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
    const { result } = renderHook(() => ({ navigate: useAppNavigate(), location: useLocation() }), { wrapper });
    act(() => result.current.navigate('/painel/usuarios'));
    expect(result.current.location.pathname).toBe('/painel/usuarios');
  });
});
