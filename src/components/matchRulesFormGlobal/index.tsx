import { useState, type FormEvent } from 'react';
import type { IRegrasPartida } from '@/@types/liveSheet';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CheckboxGlobal } from '@/components/checkboxGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { MATCH_RULE_LIMITS, hasErrors, parseIntField, validateMatchRules, type FormErrors } from '@/utils/competitionValidators';
import { Form, Grid, Help, Legend, Section } from './style';
import type { IMatchRulesFormProps } from './types';

type NumericField = keyof typeof MATCH_RULE_LIMITS;

const FIBA: IRegrasPartida = {
  qtd_periodos: 4,
  duracao_periodo_min: 10,
  duracao_prorrogacao_min: 5,
  faltas_bonus_equipe: 4,
  faltas_exclusao_jogador: 5,
  tempos_primeira_metade: 2,
  tempos_segunda_metade: 3,
  tempos_prorrogacao: 1,
  relogio_posse: true,
  posse_segundos: 24,
  posse_reset_curto: 14,
};

const toStrings = (values: IRegrasPartida) =>
  Object.fromEntries((Object.keys(MATCH_RULE_LIMITS) as NumericField[]).map((f) => [f, String(values[f])])) as Record<
    NumericField,
    string
  >;

// Regras usadas pela súmula ao vivo (seção 6.5.1). Ficam fora da trava de estrutura.
export function MatchRulesFormGlobal({ initialValues, saving = false, error, saved = false, onSave }: IMatchRulesFormProps) {
  const [numbers, setNumbers] = useState(() => toStrings(initialValues));
  const [relogioPosse, setRelogioPosse] = useState(initialValues.relogio_posse);
  const [errors, setErrors] = useState<FormErrors<IRegrasPartida>>({});

  const input = (field: NumericField, label: string, hint?: string) => (
    <InputGlobal
      label={label}
      type="number"
      inputMode="numeric"
      min={MATCH_RULE_LIMITS[field][0]}
      max={MATCH_RULE_LIMITS[field][1]}
      value={numbers[field]}
      onChange={(e) => setNumbers((atual) => ({ ...atual, [field]: e.target.value }))}
      error={errors[field]}
      hint={hint}
    />
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...(Object.fromEntries(
        (Object.keys(MATCH_RULE_LIMITS) as NumericField[]).map((f) => [f, parseIntField(numbers[f])]),
      ) as Record<NumericField, number>),
      relogio_posse: relogioPosse,
    };
    const found = validateMatchRules(payload);
    setErrors(found);
    if (!hasErrors(found)) onSave(payload);
  };

  return (
    <Form onSubmit={handleSubmit} noValidate aria-label="Regras da partida">
      <Section>
        <Legend>Regras da partida</Legend>
        <Help>Usadas pela súmula ao vivo do mesário: cronômetro, faltas e tempos debitados. Padrão FIBA.</Help>
        <Grid>
          {input('qtd_periodos', 'Períodos')}
          {input('duracao_periodo_min', 'Minutos por período')}
          {input('duracao_prorrogacao_min', 'Minutos da prorrogação')}
          {input('faltas_bonus_equipe', 'Faltas da equipe até o bônus', 'Depois delas, cada falta dá lances livres.')}
          {input('faltas_exclusao_jogador', 'Faltas para excluir o jogador')}
          {input('tempos_primeira_metade', 'Tempos na 1ª metade')}
          {input('tempos_segunda_metade', 'Tempos na 2ª metade')}
          {input('tempos_prorrogacao', 'Tempos por prorrogação')}
        </Grid>
        <CheckboxGlobal
          label="Usar relógio de posse (24 segundos)"
          checked={relogioPosse}
          onChange={(e) => setRelogioPosse(e.target.checked)}
        />
        {relogioPosse && (
          <Grid>
            {input('posse_segundos', 'Segundos de posse')}
            {input('posse_reset_curto', 'Posse curta (rebote ofensivo)')}
          </Grid>
        )}
      </Section>
      {error && <AlertGlobal variant="error" message={error} />}
      {saved && !error && <AlertGlobal variant="success" message="Regras da partida salvas." />}
      <FormActionsGlobal>
        <ButtonGlobal
          label="Usar padrão FIBA"
          variant="ghost"
          disabled={saving}
          onClick={() => {
            setNumbers(toStrings(FIBA));
            setRelogioPosse(true);
            setErrors({});
          }}
        />
        <ButtonGlobal label="Salvar regras" type="submit" loading={saving} />
      </FormActionsGlobal>
    </Form>
  );
}

export type { IMatchRulesFormProps } from './types';
