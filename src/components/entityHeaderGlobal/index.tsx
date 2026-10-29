import { AvatarGlobal } from '@/components/avatarGlobal';
import { Actions, Badges, Container, Identity, Subtitle, Texts, Title } from './style';
import type { IEntityHeaderProps } from './types';

export function EntityHeaderGlobal({ title, subtitle, imageUrl, badges, actions }: IEntityHeaderProps) {
  return (
    <Container>
      <Identity>
        <AvatarGlobal name={title} src={imageUrl} size="lg" shape="square" />
        <Texts>
          <Title>{title}</Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
          {badges && <Badges>{badges}</Badges>}
        </Texts>
      </Identity>
      {actions && <Actions>{actions}</Actions>}
    </Container>
  );
}

export type { IEntityHeaderProps } from './types';
