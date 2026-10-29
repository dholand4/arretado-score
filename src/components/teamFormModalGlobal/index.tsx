import { useId, useState, type FormEvent } from 'react';
import type { ImageChange, ITimeInput } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ImageUploadGlobal } from '@/components/imageUploadGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { hasErrors, validateTeam, type FormErrors } from '@/utils/competitionValidators';
import { Form } from './style';
import type { ITeamFormModalProps } from './types';

export function TeamFormModalGlobal({
  open,
  initialValues,
  ownerMode = false,
  donos = [],
  saving = false,
  error,
  onSubmit,
  onClose,
}: ITeamFormModalProps) {
  const formId = useId();
  const [values, setValues] = useState<ITimeInput>({
    nome: initialValues?.nome ?? '',
    sigla: initialValues?.sigla ?? '',
    dono_id: initialValues?.dono_id ?? null,
  });
  const [logo, setLogo] = useState<ImageChange>({ kind: 'keep' });
  const [errors, setErrors] = useState<FormErrors<ITimeInput>>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...values, nome: values.nome.trim(), sigla: values.sigla.trim().toUpperCase() };
    const found = validateTeam(payload);
    setErrors(found);
    if (hasErrors(found)) return;
    // No modo dono, sigla e dono seguem os atuais (o banco não deixa o dono mudá-los).
    onSubmit(ownerMode ? { nome: payload.nome, sigla: initialValues?.sigla ?? '', dono_id: initialValues?.dono_id ?? null } : payload, logo);
  };

  return (
    <ModalGlobal
      open={open}
      title={initialValues ? 'Editar time' : 'Novo time'}
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={saving} />
          <ButtonGlobal label="Salvar" type="submit" form={formId} loading={saving} />
        </>
      }
    >
      <Form id={formId} onSubmit={handleSubmit} noValidate>
        <ImageUploadGlobal
          label="Logo do time"
          name={values.nome}
          currentUrl={initialValues?.logo_url}
          value={logo}
          onChange={setLogo}
          shape="square"
        />
        <InputGlobal
          label="Nome do time"
          value={values.nome}
          onChange={(e) => setValues((v) => ({ ...v, nome: e.target.value }))}
          error={errors.nome}
          autoFocus={!initialValues}
        />
        {!ownerMode && (
          <>
            <InputGlobal
              label="Sigla"
              maxLength={4}
              value={values.sigla}
              onChange={(e) => setValues((v) => ({ ...v, sigla: e.target.value.toUpperCase() }))}
              error={errors.sigla}
              hint="Até 4 letras, usada nos placares compactos."
            />
            <SelectGlobal
              label="Dono do time"
              value={values.dono_id ?? ''}
              options={[{ value: '', label: 'Sem dono vinculado' }, ...donos.map((d) => ({ value: d.id, label: d.nome }))]}
              onChange={(e) => setValues((v) => ({ ...v, dono_id: e.target.value || null }))}
            />
          </>
        )}
        {error && <AlertGlobal variant="error" message={error} />}
      </Form>
    </ModalGlobal>
  );
}

export type { ITeamFormModalProps } from './types';
