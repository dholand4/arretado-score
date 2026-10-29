import { useParams } from 'react-router-dom';
import type { IRouteParams } from '@/routes/types';

// Lê parâmetros de rota tipados; falha cedo se a tela for montada na rota errada.
export function useRouteParams<K extends keyof IRouteParams>(...keys: K[]): Pick<IRouteParams, K> {
  const params = useParams();
  const result = {} as Pick<IRouteParams, K>;
  for (const key of keys) {
    const value = params[key];
    if (!value) throw new Error(`Parâmetro de rota ausente: ${key}`);
    result[key] = value as IRouteParams[K];
  }
  return result;
}
