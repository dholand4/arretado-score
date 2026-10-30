import { useState, type FormEvent } from 'react';
import type { ICompeticaoBasicos, ImageChange, Modalidade } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { ImageUploadGlobal } from '@/components/imageUploadGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { TextareaGlobal } from '@/components/textareaGlobal';
import { MODALIDADE_OPTIONS } from '@/constants/competition';
import { hasErrors, parseIntField, validateBasics, type FormErrors } from '@/utils/competitionValidators';
import { slugify } from '@/utils/slugify';
import { Form, Grid } from './style';
import type { IBasicInfoFormProps } from './types';

export function BasicInfoFormGlobal({ initialValues, logoUrl, isNew, saving = false, error, onSave }: IBasicInfoFormProps) {
  const [values, setValues] = useState(initialValues);
  const [intervalo, setIntervalo] = useState(String(initialValues.intervalo_jogos_min));
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [logo, setLogo] = useState<ImageChange>({ kind: 'keep' });
  const [errors, setErrors] = useState<FormErrors<ICompeticaoBasicos>>({});
  // Qual botão disparou o último salvamento (para o indicador de carregamento).
  const [advance, setAdvance] = useState(false);

  const set = <K extends keyof ICompeticaoBasicos>(field: K, value: ICompeticaoBasicos[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const handleNome = (nome: string) => {
    setValues((current) => ({ ...current, nome, slug: slugEdited ? current.slug : slugify(nome) }));
  };

  const save = (goNext: boolean) => {
    const payload = { ...values, nome: values.nome.trim(), intervalo_jogos_min: parseIntField(intervalo) };
    const found = validateBasics(payload);
    setErrors(found);
    if (hasErrors(found)) return;
    setAdvance(goNext);
    onSave(payload, logo, goNext);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save(false);
  };

  return (
    <Form onSubmit={handleSubmit} noValidate aria-label="Dados básicos">
      <ImageUploadGlobal
        label="Logo"
        name={values.nome}
        currentUrl={logoUrl}
        value={logo}
        onChange={setLogo}
        shape="square"
      />
      <Grid>
        <InputGlobal
          label="Nome da competição"
          value={values.nome}
          onChange={(e) => handleNome(e.target.value)}
          error={errors.nome}
          autoFocus={isNew}
        />
        <InputGlobal
          label="Endereço público (slug)"
          value={values.slug}
          onChange={(e) => {
            setSlugEdited(true);
            set('slug', e.target.value.toLowerCase());
          }}
          error={errors.slug}
          hint={values.slug ? `Página pública: /c/${values.slug}` : 'Gerado a partir do nome.'}
        />
        <SelectGlobal
          label="Modalidade"
          value={values.modalidade}
          options={MODALIDADE_OPTIONS}
          onChange={(e) => set('modalidade', e.target.value as Modalidade)}
        />
        <InputGlobal
          label="Intervalo padrão entre jogos (min)"
          type="number"
          inputMode="numeric"
          min={1}
          value={intervalo}
          onChange={(e) => setIntervalo(e.target.value)}
          error={errors.intervalo_jogos_min}
          hint="Do início de um jogo até o início do próximo."
        />
      </Grid>
      <InputGlobal
        label="Local padrão"
        value={values.local_padrao}
        onChange={(e) => set('local_padrao', e.target.value)}
        hint="Preenche automaticamente o local dos jogos lançados."
      />
      <TextareaGlobal
        label="Descrição"
        value={values.descricao}
        onChange={(e) => set('descricao', e.target.value)}
      />
      {error && <AlertGlobal variant="error" message={error} />}
      <FormActionsGlobal note={isNew ? 'A competição é criada como rascunho; só você e o master a veem.' : undefined}>
        <ButtonGlobal
          label={isNew ? 'Criar rascunho' : 'Salvar rascunho'}
          variant="outline"
          type="submit"
          loading={saving && !advance}
          disabled={saving}
        />
        <ButtonGlobal
          label="Salvar e continuar"
          loading={saving && advance}
          disabled={saving}
          onClick={() => save(true)}
        />
      </FormActionsGlobal>
    </Form>
  );
}

export type { IBasicInfoFormProps } from './types';
