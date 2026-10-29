import { useId, useState, type FormEvent } from 'react';
import type { IEventoInput } from '@/@types/event';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { TextareaGlobal } from '@/components/textareaGlobal';
import { hasErrors, parseIntField, type FormErrors } from '@/utils/competitionValidators';
import { validateEvent } from '@/utils/eventSchedule';
import { Form, Row } from './style';
import type { IEventFormModalProps } from './types';

type NumberField = 'qtd_jogos' | 'intervalo_min';

// Novo dia de jogos (seção 6.2): local e intervalo vêm preenchidos com os padrões da competição.
export function EventFormModalGlobal({ open, initialValues, saving = false, error, onSubmit, onClose }: IEventFormModalProps) {
  const formId = useId();
  const [values, setValues] = useState(initialValues);
  const [numbers, setNumbers] = useState<Record<NumberField, string>>({
    qtd_jogos: String(initialValues.qtd_jogos),
    intervalo_min: String(initialValues.intervalo_min),
  });
  const [errors, setErrors] = useState<FormErrors<IEventoInput>>({});

  const set = (field: keyof IEventoInput, value: string) => setValues((v) => ({ ...v, [field]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: IEventoInput = {
      ...values,
      local: values.local.trim(),
      observacoes: values.observacoes.trim(),
      qtd_jogos: parseIntField(numbers.qtd_jogos),
      intervalo_min: parseIntField(numbers.intervalo_min),
    };
    const found = validateEvent(payload);
    setErrors(found);
    if (hasErrors(found)) return;
    onSubmit(payload);
  };

  return (
    <ModalGlobal
      open={open}
      title="Novo dia de jogos"
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={saving} />
          <ButtonGlobal label="Montar dia" type="submit" form={formId} loading={saving} />
        </>
      }
    >
      <Form id={formId} onSubmit={handleSubmit} noValidate>
        <Row>
          <InputGlobal label="Data" type="date" value={values.data} error={errors.data} onChange={(e) => set('data', e.target.value)} />
          <InputGlobal
            label="Hora de início"
            type="time"
            value={values.hora_inicio}
            error={errors.hora_inicio}
            onChange={(e) => set('hora_inicio', e.target.value)}
          />
        </Row>
        <InputGlobal label="Local" value={values.local} error={errors.local} onChange={(e) => set('local', e.target.value)} />
        <Row>
          <InputGlobal
            label="Quantidade de jogos"
            type="number"
            inputMode="numeric"
            min={1}
            value={numbers.qtd_jogos}
            error={errors.qtd_jogos}
            onChange={(e) => setNumbers((n) => ({ ...n, qtd_jogos: e.target.value }))}
          />
          <InputGlobal
            label="Intervalo (min)"
            type="number"
            inputMode="numeric"
            min={1}
            value={numbers.intervalo_min}
            error={errors.intervalo_min}
            hint="Entre o início de um jogo e o do próximo."
            onChange={(e) => setNumbers((n) => ({ ...n, intervalo_min: e.target.value }))}
          />
        </Row>
        <TextareaGlobal
          label="Observações"
          value={values.observacoes}
          rows={2}
          onChange={(e) => set('observacoes', e.target.value)}
        />
        {error && <AlertGlobal variant="error" message={error} />}
      </Form>
    </ModalGlobal>
  );
}

export type { IEventFormModalProps } from './types';
