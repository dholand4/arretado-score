import { useContext } from 'react';
import { AuthContext, type IAuthContext } from '@/providers/AuthProvider';

export function useAuth(): IAuthContext {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return context;
}
