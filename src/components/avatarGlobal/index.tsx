import { initials } from '@/utils/text';
import { Frame, Image } from './style';
import type { IAvatarProps } from './types';

export function AvatarGlobal({ name, src, size = 'md', shape = 'circle' }: IAvatarProps) {
  return (
    <Frame $size={size} $shape={shape} aria-hidden={src ? undefined : true}>
      {src ? <Image src={src} alt={name} loading="lazy" /> : initials(name)}
    </Frame>
  );
}

export type { IAvatarProps } from './types';
