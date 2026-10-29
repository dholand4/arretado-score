import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { Message } from './style';
import type { IConfirmDialogProps } from './types';

export function ConfirmDialogGlobal({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  loading = false,
  error,
  onConfirm,
  onClose,
}: IConfirmDialogProps) {
  return (
    <ModalGlobal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={loading} />
          <ButtonGlobal
            label={confirmLabel}
            variant={danger ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          />
        </>
      }
    >
      <Message>{message}</Message>
      {error && <AlertGlobal variant="error" message={error} />}
    </ModalGlobal>
  );
}

export type { IConfirmDialogProps } from './types';
