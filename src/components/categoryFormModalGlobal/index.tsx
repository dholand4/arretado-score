import { useId, useState, type FormEvent } from 'react';
import type { ICategoriaInput } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CONTA_CESTAS_OPCOES } from '@/constants/competition';
import { InputGlobal } from '@/components/inputGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { hasErrors, validateCategory, type FormErrors } from '@/utils/competitionValidators';
import { Form } from './style';
import type { ICategoryFormModalProps } from './types';

const EMPTY: ICategoriaInput = { nome: '', sigla: '', titulo_ranking: '', conta_cestas_de: null };

const CESTAS_OPTIONS = CONTA_CESTAS_OPCOES.map((option) => ({ value: String(option.value ?? ''), label: option.label }));

export function CategoryFormModalGlobal({
  open,
  initialValues,
  isScoreCategory = false,
  saving = false,
  error,
  onSubmit,
  onClose,
}: ICategoryFormModalProps) {
  const formId = useId();
  const [values, setValues] = useState(initialValues ?? EMPTY);
  const [errors, setErrors] = useState<FormErrors<ICategoriaInput>>({});
  const set = (field: 'nome' | 'sigla' | 'titulo_ranking', value: string) => setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      nome: values.nome.trim(),
      sigla: values.sigla.trim().toUpperCase(),
      titulo_ranking: values.titulo_ranking.trim(),
      conta_cestas_de: isScoreCategory ? null : values.conta_cestas_de,
    };
    const found = validateCategory(payload);
    setErrors(found);
    if (!hasErrors(found)) onSubmit(payload);
  };

  return (
    <ModalGlobal
      open={open}
      title={initialValues ? 'Editar estatística' : 'Nova estatística'}
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={saving} />
          <ButtonGlobal label="Salvar" type="submit" form={formId} loading={saving} />
        </>
      }
    >
      <Form id={formId} onSubmit={handleSubmit} noValidate>
        {isScoreCategory && (
          <AlertGlobal variant="info" message="Esta é a categoria do placar: o placar do jogo sai da soma dela." />
        )}
        <InputGlobal
          label="Nome"
          placeholder="Ex.: Rebotes"
          value={values.nome}
          onChange={(e) => set('nome', e.target.value)}
          error={errors.nome}
          autoFocus
        />
        <InputGlobal
          label="Sigla"
          placeholder="Ex.: REB"
          maxLength={5}
          value={values.sigla}
          onChange={(e) => set('sigla', e.target.value.toUpperCase())}
          error={errors.sigla}
        />
        <InputGlobal
          label="Título do ranking"
          placeholder="Ex.: Reboteiro"
          value={values.titulo_ranking}
          onChange={(e) => set('titulo_ranking', e.target.value)}
          error={errors.titulo_ranking}
        />
        {!isScoreCategory && (
          <SelectGlobal
            label="Preencher pela súmula ao vivo"
            options={CESTAS_OPTIONS}
            value={String(values.conta_cestas_de ?? '')}
            onChange={(e) =>
              setValues((current) => ({ ...current, conta_cestas_de: e.target.value ? Number(e.target.value) : null }))
            }
          />
        )}
        {values.conta_cestas_de !== null && !isScoreCategory && (
          <AlertGlobal
            variant="info"
            message="Ao encerrar o jogo ao vivo, cada jogador recebe quantas dessas cestas converteu. Os jogos já encerrados pela súmula ao vivo também são preenchidos. Jogos lançados só na súmula normal continuam sendo digitados."
          />
        )}
        {error && <AlertGlobal variant="error" message={error} />}
      </Form>
    </ModalGlobal>
  );
}

export type { ICategoryFormModalProps } from './types';
