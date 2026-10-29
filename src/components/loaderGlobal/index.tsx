import { Spinner, Wrapper } from './style';
import type { ILoaderProps } from './types';

export function LoaderGlobal({ label, size = 'md', inline = false, fullScreen = false }: ILoaderProps) {
  return (
    <Wrapper role="status" aria-label={label ?? 'Carregando'} $fullScreen={fullScreen} $inline={inline}>
      <Spinner $size={size} aria-hidden="true" />
      {label && <span>{label}</span>}
    </Wrapper>
  );
}

export type { ILoaderProps } from './types';
