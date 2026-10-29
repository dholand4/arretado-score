import { CloseButton, Container, Content, Title } from './style';
import type { IAlertProps } from './types';

export function AlertGlobal({ message, variant = 'info', title, onClose }: IAlertProps) {
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
  return (
    <Container role={role} $variant={variant}>
      <Content>
        {title && <Title>{title}</Title>}
        <span>{message}</span>
      </Content>
      {onClose && (
        <CloseButton type="button" aria-label="Fechar aviso" onClick={onClose}>
          ×
        </CloseButton>
      )}
    </Container>
  );
}

export type { AlertVariant, IAlertProps } from './types';
