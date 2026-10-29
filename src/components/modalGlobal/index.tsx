import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Body, CloseButton, Dialog, Footer, Header, Overlay, Title } from './style';
import type { IModalProps } from './types';

export function ModalGlobal({ open, title, onClose, children, footer }: IModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <Overlay onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <Header>
          <Title id={titleId}>{title}</Title>
          <CloseButton type="button" aria-label="Fechar" onClick={onClose}>
            ×
          </CloseButton>
        </Header>
        <Body>{children}</Body>
        {footer && <Footer>{footer}</Footer>}
      </Dialog>
    </Overlay>,
    document.body,
  );
}

export type { IModalProps } from './types';
