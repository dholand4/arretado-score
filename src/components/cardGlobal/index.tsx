import { Container, Header, Title } from './style';
import type { ICardProps } from './types';

export function CardGlobal({ title, actions, children, as = 'section' }: ICardProps) {
  return (
    <Container as={as}>
      {(title || actions) && (
        <Header>
          {title && <Title>{title}</Title>}
          {actions}
        </Header>
      )}
      {children}
    </Container>
  );
}

export type { ICardProps } from './types';
