import { ButtonGlobal } from '@/components/buttonGlobal';
import { useShare } from '@/hooks/useShare';
import type { IShareButtonProps } from './types';

export function ShareButtonGlobal({ title, text, url, size = 'sm' }: IShareButtonProps) {
  const { share, copied } = useShare();
  return (
    <ButtonGlobal
      variant="outline"
      size={size}
      label={copied ? 'Link copiado!' : 'Compartilhar'}
      aria-live="polite"
      onClick={() => void share({ title, text, url })}
    />
  );
}

export type { IShareButtonProps } from './types';
