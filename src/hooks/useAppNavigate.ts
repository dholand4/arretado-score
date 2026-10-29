import { useCallback } from 'react';
import { useNavigate, type NavigateOptions } from 'react-router-dom';
import type { RoutePath } from '@/routes/types';

// Navegação tipada: só aceita caminhos declarados em routes/types.ts.
export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback((to: RoutePath, options?: NavigateOptions) => navigate(to, options), [navigate]);
}
