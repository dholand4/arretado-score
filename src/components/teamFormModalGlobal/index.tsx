import { useId, useState, type FormEvent } from 'react';
import type { ImageChange, INovoDonoInput, ITimeInput } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ImageUploadGlobal } from '@/components/imageUploadGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SegmentedGlobal } from '@/components/segmentedGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { hasErrors, validateNewOwner, validateTeam, type FormErrors } from '@/utils/competitionValidators';
import { Form, OwnerBox, OwnerTitle } from './style';
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
  // Time novo nasce com dono: cadastra o login dele aqui ou escolhe um dono que já existe.
  const isNew = !initialValues && !ownerMode;
  // Time novo começa cadastrando o acesso; na edição, parte do acesso atual (e pode cadastrar outro).
  const [ownerChoice, setOwnerChoice] = useState<'novo' | 'existente'>(initialValues ? 'existente' : 'novo');
  const [novoDono, setNovoDono] = useState<INovoDonoInput>({ nome: '', email: '', senha: '' });
  const [ownerErrors, setOwnerErrors] = useState<FormErrors<INovoDonoInput>>({});
  const [ownerMissing, setOwnerMissing] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...values, nome: values.nome.trim(), sigla: values.sigla.trim().toUpperCase() };
    const found = validateTeam(payload);
    setErrors(found);
    const criandoDono = !ownerMode && ownerChoice === 'novo';
    const dono = { nome: novoDono.nome.trim(), email: novoDono.email.trim().toLowerCase(), senha: novoDono.senha };
    const foundOwner = criandoDono ? validateNewOwner(dono) : {};
    setOwnerErrors(foundOwner);
    const semDono = isNew && ownerChoice === 'existente' && !payload.dono_id;
    setOwnerMissing(semDono);
    if (hasErrors(found) || hasErrors(foundOwner) || semDono) return;
    // No modo dono, sigla e dono seguem os atuais (o banco não deixa o dono mudá-los).
    if (ownerMode) {
      onSubmit({ nome: payload.nome, sigla: initialValues?.sigla ?? '', dono_id: initialValues?.dono_id ?? null }, logo);
      return;
    }
    onSubmit(criandoDono ? { ...payload, dono_id: null } : payload, logo, criandoDono ? dono : undefined);
  };

  const ownerField = (field: keyof INovoDonoInput, label: string, extra: Record<string, string> = {}) => (
    <InputGlobal
      label={label}
      value={novoDono[field]}
      onChange={(e) => setNovoDono((d) => ({ ...d, [field]: e.target.value }))}
      error={ownerErrors[field]}
      {...extra}
    />
  );

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
            <OwnerBox>
              <OwnerTitle>Acesso da equipe</OwnerTitle>
              <SegmentedGlobal
                ariaLabel="Acesso da equipe"
                options={[
                  { value: 'novo', label: 'Cadastrar acesso' },
                  { value: 'existente', label: isNew ? 'Equipe já cadastrada' : 'Acesso atual' },
                ]}
                value={ownerChoice}
                onChange={setOwnerChoice}
              />
              {ownerChoice === 'novo' ? (
                <>
                  {ownerField('nome', 'Nome do responsável', { autoComplete: 'off' })}
                  {ownerField('email', 'E-mail de acesso', { type: 'email', inputMode: 'email', autoComplete: 'off' })}
                  {ownerField('senha', 'Senha provisória', {
                    type: 'text',
                    autoComplete: 'new-password',
                    hint: 'Mínimo de 8 caracteres. A equipe troca no primeiro acesso.',
                  })}
                </>
              ) : (
                <SelectGlobal
                  label="Equipe"
                  value={values.dono_id ?? ''}
                  error={ownerMissing ? 'Escolha a equipe.' : undefined}
                  options={[
                    { value: '', label: isNew ? 'Escolha…' : 'Sem acesso vinculado' },
                    ...donos.map((d) => ({ value: d.id, label: d.nome })),
                  ]}
                  onChange={(e) => setValues((v) => ({ ...v, dono_id: e.target.value || null }))}
                />
              )}
            </OwnerBox>
          </>
        )}
        {error && <AlertGlobal variant="error" message={error} />}
      </Form>
    </ModalGlobal>
  );
}

export type { ITeamFormModalProps } from './types';
