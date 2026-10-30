import { useId, useState, type FormEvent } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { TextareaGlobal } from '@/components/textareaGlobal';
import { ACCEPTED_RECEIPT_TYPES } from '@/constants/finance';
import { Description, Form } from './style';
import type { IMarkPaidModalProps } from './types';

// "Marcar como pago" (8.1): data (padrão hoje), comprovante opcional e observação.
export function MarkPaidModalGlobal({
  open,
  description,
  defaultDate,
  saving = false,
  error,
  onSubmit,
  onClose,
}: IMarkPaidModalProps) {
  const formId = useId();
  const [pagoEm, setPagoEm] = useState(defaultDate);
  const [observacao, setObservacao] = useState('');
  const [comprovante, setComprovante] = useState<File | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ pagoEm: pagoEm || defaultDate, observacao, comprovante });
  };

  return (
    <ModalGlobal
      open={open}
      title="Marcar como pago"
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={saving} />
          <ButtonGlobal label="Confirmar pagamento" type="submit" form={formId} loading={saving} />
        </>
      }
    >
      <Form id={formId} onSubmit={handleSubmit} noValidate>
        <Description>{description}</Description>
        <InputGlobal label="Data do pagamento" type="date" value={pagoEm} onChange={(event) => setPagoEm(event.target.value)} />
        <InputGlobal
          label="Comprovante (opcional)"
          type="file"
          accept={ACCEPTED_RECEIPT_TYPES}
          hint="Imagem ou PDF de até 5 MB."
          onChange={(event) => setComprovante(event.target.files?.[0] ?? null)}
        />
        <TextareaGlobal label="Observação" value={observacao} onChange={(event) => setObservacao(event.target.value)} />
        {error && <AlertGlobal variant="error" message={error} />}
      </Form>
    </ModalGlobal>
  );
}

export type { IMarkPaidModalProps } from './types';
