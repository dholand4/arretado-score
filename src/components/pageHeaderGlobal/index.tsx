import { Actions, Container, Subtitle, Texts, Title } from './style';
import type { IPageHeaderProps } from './types';

export function PageHeaderGlobal({ title, subtitle, actions }: IPageHeaderProps) {
  return (
    <Container>
      <Texts>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Texts>
      {actions && <Actions>{actions}</Actions>}
    </Container>
  );
}

export type { IPageHeaderProps } from './types';
