import { Container, Description, Title } from './style';
import type { IEmptyStateProps } from './types';

export function EmptyStateGlobal({ title, description, action }: IEmptyStateProps) {
  return (
    <Container>
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action}
    </Container>
  );
}

export type { IEmptyStateProps } from './types';
