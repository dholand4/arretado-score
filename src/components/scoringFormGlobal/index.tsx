import { useState, type FormEvent } from 'react';
import type { CriterioDesempate, ICompeticaoPontuacao } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CheckboxGlobal } from '@/components/checkboxGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { OrderListGlobal } from '@/components/orderListGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { CRITERIOS_DESEMPATE, SCORING_PRESETS, TODOS_CRITERIOS } from '@/constants/competition';
import { hasErrors, parseIntField, validateScoring, type FormErrors } from '@/utils/competitionValidators';
import { AddRow, Form, Grid, Help, Legend, Presets, Section } from './style';
import type { IScoringFormProps } from './types';

const NUMERIC_FIELDS = [
  'pontos_vitoria',
  'pontos_derrota',
  'pontos_derrota_wo',
  'pontos_empate',
  'wo_placar_vencedor',
  'wo_placar_perdedor',
] as const;
type NumericField = (typeof NUMERIC_FIELDS)[number];

const toStrings = (values: ICompeticaoPontuacao) =>
  Object.fromEntries(NUMERIC_FIELDS.map((field) => [field, String(values[field])])) as Record<NumericField, string>;

export function ScoringFormGlobal({
  initialValues,
  modalidade,
  locked = false,
  saving = false,
  error,
  onSave,
}: IScoringFormProps) {
  const [numbers, setNumbers] = useState(() => toStrings(initialValues));
  const [permiteEmpate, setPermiteEmpate] = useState(initialValues.permite_empate);
  const [criterios, setCriterios] = useState<CriterioDesempate[]>(initialValues.criterios_desempate);
  const [novoCriterio, setNovoCriterio] = useState('');
  const [errors, setErrors] = useState<FormErrors<ICompeticaoPontuacao>>({});
  // Qual botão disparou o último salvamento (para o indicador de carregamento).
  const [advance, setAdvance] = useState(false);

  const presets = (['padrao', 'fiba', ...(modalidade === 'futsal' ? ['futsal' as const] : [])] as const).map(
    (key) => SCORING_PRESETS[key],
  );
  const disponiveis = TODOS_CRITERIOS.filter((criterio) => !criterios.includes(criterio));

  const applyPreset = (preset: (typeof presets)[number]) => {
    const { permite_empate, ...pontos } = preset.values;
    const asStrings = Object.fromEntries(Object.entries(pontos).map(([field, value]) => [field, String(value)]));
    setNumbers((current) => ({ ...current, ...asStrings }));
    setPermiteEmpate(permite_empate);
  };

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

  const save = (goNext: boolean) => {
    const payload: ICompeticaoPontuacao = {
      ...(Object.fromEntries(NUMERIC_FIELDS.map((f) => [f, parseIntField(numbers[f])])) as Record<NumericField, number>),
      permite_empate: permiteEmpate,
      criterios_desempate: criterios,
    };
    if (!permiteEmpate) payload.pontos_empate = 0;
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
    <Form onSubmit={handleSubmit} noValidate aria-label="Pontuação e W.O.">
      {locked && (
        <AlertGlobal
          variant="warning"
          message="A estrutura está travada porque já há súmula lançada. Só o admin master pode alterar pontuação e critérios."
        />
      )}
      <Section>
        <Legend>Pontos na tabela</Legend>
        <Presets>
          {presets.map((preset) => (
            <ButtonGlobal
              key={preset.label}
              label={preset.label}
              variant="outline"
              size="sm"
              disabled={locked}
              onClick={() => applyPreset(preset)}
            />
          ))}
        </Presets>
        <Grid>
          {numberInput('pontos_vitoria', 'Vitória')}
          {numberInput('pontos_derrota', 'Derrota')}
          {numberInput('pontos_derrota_wo', 'Derrota por W.O.')}
          {permiteEmpate && numberInput('pontos_empate', 'Empate')}
        </Grid>
        <CheckboxGlobal
          label="Permite empate"
          description="Basquete e vôlei não têm empate. No mata-mata sempre precisa haver vencedor."
          checked={permiteEmpate}
          disabled={locked}
          onChange={(e) => setPermiteEmpate(e.target.checked)}
        />
      </Section>

      <Section>
        <Legend>W.O.</Legend>
        <Grid>
          {numberInput('wo_placar_vencedor', 'Placar do time presente')}
          {numberInput('wo_placar_perdedor', 'Placar do time ausente')}
        </Grid>
      </Section>

      <Section>
        <Legend>Critérios de desempate</Legend>
        <Help>Aplicados nesta ordem depois dos pontos. Último recurso: ordem alfabética, com aviso de empate técnico.</Help>
        <OrderListGlobal
          ariaLabel="Critérios de desempate"
          items={criterios.map((id) => ({ id, ...CRITERIOS_DESEMPATE[id] }))}
          onChange={(ids) => setCriterios(ids as CriterioDesempate[])}
          onRemove={(id) => setCriterios((current) => current.filter((c) => c !== id))}
          disabled={locked}
        />
        {disponiveis.length > 0 && !locked && (
          <AddRow>
            <SelectGlobal
              label="Adicionar critério"
              value={novoCriterio}
              options={[
                { value: '', label: 'Escolha…' },
                ...disponiveis.map((c) => ({ value: c, label: CRITERIOS_DESEMPATE[c].label })),
              ]}
              onChange={(e) => setNovoCriterio(e.target.value)}
            />
            <ButtonGlobal
              label="Adicionar"
              variant="outline"
              disabled={!novoCriterio}
              onClick={() => {
                setCriterios((current) => [...current, novoCriterio as CriterioDesempate]);
                setNovoCriterio('');
              }}
            />
          </AddRow>
        )}
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
