import { ButtonGlobal } from '@/components/buttonGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { getErrorMessage } from '@/utils/appError';
import type { IErrorStateProps } from './types';

export function ErrorStateGlobal({ title = 'Não foi possível carregar', error, onRetry }: IErrorStateProps) {
  return (
    <EmptyStateGlobal
      title={title}
      description={getErrorMessage(error)}
      action={onRetry && <ButtonGlobal label="Tentar novamente" variant="outline" onClick={onRetry} />}
    />
  );
}

export type { IErrorStateProps } from './types';
