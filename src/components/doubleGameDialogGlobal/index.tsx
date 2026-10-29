import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { pluralize } from '@/utils/text';
import { Message } from './style';
import type { IDoubleGameDialogProps } from './types';

// Aviso da seção 6.2: só inclui jogo duplo com a confirmação do admin.
export function DoubleGameDialogGlobal({
  open,
  message,
  maxWithoutRepeat,
  loading = false,
  error,
  onAllowDouble,
  onLimit,
  onClose,
}: IDoubleGameDialogProps) {
  return (
    <ModalGlobal
      open={open}
      title="Jogo duplo"
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={loading} />
          {maxWithoutRepeat > 0 && (
            <ButtonGlobal
              label={`Montar só ${pluralize(maxWithoutRepeat, 'jogo', 'jogos')}`}
              variant="outline"
              disabled={loading}
              onClick={onLimit}
            />
          )}
          <ButtonGlobal label="Permitir jogo duplo" loading={loading} onClick={onAllowDouble} />
        </>
      }
    >
      <Message>{message}</Message>
      {error && <AlertGlobal variant="error" message={error} />}
    </ModalGlobal>
  );
}

export type { IDoubleGameDialogProps } from './types';
