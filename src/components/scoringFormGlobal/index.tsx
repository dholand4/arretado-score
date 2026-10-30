import { useState, type FormEvent } from 'react';
import type { ICompeticaoPontuacao } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CheckboxGlobal } from '@/components/checkboxGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { CRITERIOS_DESEMPATE, CRITERIOS_FIXOS } from '@/constants/competition';
import { hasErrors, parseIntField, validateScoring, type FormErrors } from '@/utils/competitionValidators';
import { Criteria, Form, Grid, Help, Legend, Section } from './style';
import type { IScoringFormProps } from './types';

const NUMERIC_FIELDS = ['pontos_vitoria', 'pontos_derrota', 'pontos_empate', 'wo_placar_vencedor'] as const;
type NumericField = (typeof NUMERIC_FIELDS)[number];

const toStrings = (values: ICompeticaoPontuacao) =>
  Object.fromEntries(NUMERIC_FIELDS.map((field) => [field, String(values[field])])) as Record<NumericField, string>;

// No W.O. quem veio ganha os pontos de vitória e quem faltou os de derrota; o placar é
// "presente x 0", então o saldo fica +N para um e -N para o outro.
export function ScoringFormGlobal({
  initialValues,
  locked = false,
  warnRecalculation = false,
  saving = false,
  error,
  onSave,
}: IScoringFormProps) {
  const [numbers, setNumbers] = useState(() => toStrings(initialValues));
  const [permiteEmpate, setPermiteEmpate] = useState(initialValues.permite_empate);
  const [errors, setErrors] = useState<FormErrors<ICompeticaoPontuacao>>({});
  // Qual botão disparou o último salvamento (para o indicador de carregamento).
  const [advance, setAdvance] = useState(false);

  const numberInput = (field: NumericField, label: string, hint?: string) => (
    <InputGlobal
      label={label}
      type="number"
      inputMode="numeric"
      min={0}
      value={numbers[field]}
      onChange={(e) => setNumbers((current) => ({ ...current, [field]: e.target.value }))}
      error={errors[field]}
      hint={hint}
      disabled={locked}
    />
  );

  const woPlacar = parseIntField(numbers.wo_placar_vencedor);

  const save = (goNext: boolean) => {
    const parsed = Object.fromEntries(NUMERIC_FIELDS.map((f) => [f, parseIntField(numbers[f])])) as Record<
      NumericField,
      number
    >;
    const payload: ICompeticaoPontuacao = {
      ...parsed,
      pontos_empate: permiteEmpate ? parsed.pontos_empate : 0,
      pontos_derrota_wo: parsed.pontos_derrota,
      wo_placar_perdedor: 0,
      permite_empate: permiteEmpate,
      criterios_desempate: CRITERIOS_FIXOS,
    };
    const found = validateScoring(payload);
    setErrors(found);
    if (hasErrors(found)) return;
    setAdvance(goNext);
    onSave(payload, goNext);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save(false);
  };

  return (
    <Form onSubmit={handleSubmit} noValidate aria-label="Pontuação">
      {warnRecalculation && <AlertGlobal variant="warning" message="Ao alterar a pontuação, a tabela será recalculada." />}
      {locked && (
        <AlertGlobal
          variant="warning"
          message="A estrutura está travada porque já há súmula lançada. Só o Admin pode alterar a pontuação."
        />
      )}
      <Section>
        <Legend>Pontos na tabela</Legend>
        <Grid>
          {numberInput('pontos_vitoria', 'Vitória')}
          {numberInput('pontos_derrota', 'Derrota')}
          {permiteEmpate && numberInput('pontos_empate', 'Empate')}
        </Grid>
        <CheckboxGlobal
          label="Permite empate"
          description="No mata-mata sempre precisa haver vencedor."
          checked={permiteEmpate}
          disabled={locked}
          onChange={(e) => setPermiteEmpate(e.target.checked)}
        />
      </Section>

      <Section>
        <Legend>W.O.</Legend>
        <Grid>
          {numberInput(
            'wo_placar_vencedor',
            'Placar do time presente',
            Number.isFinite(woPlacar) && woPlacar > 0
              ? `Fica ${woPlacar} x 0: saldo +${woPlacar} para quem veio e -${woPlacar} para quem faltou.`
              : undefined,
          )}
        </Grid>
        <Help>Quem veio ganha os pontos de vitória; quem faltou, os de derrota.</Help>
      </Section>

      <Section>
        <Legend>Critérios de desempate</Legend>
        <Criteria>
          <li>Pontos na tabela (vitórias)</li>
          {CRITERIOS_FIXOS.map((criterio) => (
            <li key={criterio}>{CRITERIOS_DESEMPATE[criterio].label}</li>
          ))}
        </Criteria>
      </Section>

      {error && <AlertGlobal variant="error" message={error} />}
      <FormActionsGlobal>
        <ButtonGlobal
          label="Salvar rascunho"
          variant="outline"
          type="submit"
          loading={saving && !advance}
          disabled={saving || locked}
        />
        <ButtonGlobal
          label="Salvar e continuar"
          loading={saving && advance}
          disabled={saving || locked}
          onClick={() => save(true)}
        />
      </FormActionsGlobal>
    </Form>
  );
}

export type { IScoringFormProps } from './types';
