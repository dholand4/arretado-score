import { useState, type FormEvent } from 'react';
import type { CobrancaModelo } from '@/@types/competition';
import type { ICompeticaoCobranca } from '@/@types/finance';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { COBRANCA_MODELO_OPTIONS } from '@/constants/finance';
import { hasErrors, parseOptionalInt, validateBilling, type FormErrors } from '@/utils/competitionValidators';
import { Form, Grid } from './style';
import type { IBillingFormProps } from './types';

// Etapa 5 do assistente (seção 5): nenhuma, por time ou por jogador.
export function BillingFormGlobal({ initialValues, saving = false, error, onSave }: IBillingFormProps) {
  const [modelo, setModelo] = useState<CobrancaModelo>(initialValues.cobranca_modelo);
  const [valor, setValor] = useState(initialValues.cobranca_valor?.toString() ?? '');
  const [dia, setDia] = useState(initialValues.cobranca_dia_vencimento?.toString() ?? '10');
  const [mes, setMes] = useState(initialValues.cobranca_mes_inicio?.slice(0, 7) ?? '');
  const [meses, setMeses] = useState(initialValues.cobranca_qtd_meses?.toString() ?? '');
  const [errors, setErrors] = useState<FormErrors<ICompeticaoCobranca>>({});
  const [advance, setAdvance] = useState(false);

  const save = (goNext: boolean) => {
    const values: ICompeticaoCobranca =
      modelo === 'nenhuma'
        ? {
            cobranca_modelo: 'nenhuma',
            cobranca_valor: null,
            cobranca_dia_vencimento: null,
            cobranca_mes_inicio: null,
            cobranca_qtd_meses: null,
          }
        : {
            cobranca_modelo: modelo,
            cobranca_valor: valor.trim() === '' ? null : Number(valor.replace(',', '.')),
            cobranca_dia_vencimento: parseOptionalInt(dia),
            cobranca_mes_inicio: mes ? `${mes}-01` : null,
            cobranca_qtd_meses: parseOptionalInt(meses),
          };
    const found = validateBilling(values);
    setErrors(found);
    if (hasErrors(found)) return;
    setAdvance(goNext);
    onSave(values, goNext);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save(false);
  };

  return (
    <Form onSubmit={handleSubmit} noValidate aria-label="Cobrança">
      <SelectGlobal
        label="Modelo de cobrança"
        value={modelo}
        options={COBRANCA_MODELO_OPTIONS}
        onChange={(event) => setModelo(event.target.value as CobrancaModelo)}
      />
      {modelo !== 'nenhuma' && (
        <>
          <Grid>
            <InputGlobal
              label={modelo === 'por_time' ? 'Valor por time (R$)' : 'Valor por jogador (R$)'}
              inputMode="decimal"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              error={errors.cobranca_valor}
            />
            <InputGlobal
              label="Dia de vencimento"
              type="number"
              inputMode="numeric"
              min={1}
              max={28}
              value={dia}
              onChange={(event) => setDia(event.target.value)}
              error={errors.cobranca_dia_vencimento}
              hint="De 1 a 28, para existir em todos os meses."
            />
            <InputGlobal
              label="Mês de início"
              type="month"
              value={mes}
              onChange={(event) => setMes(event.target.value)}
              error={errors.cobranca_mes_inicio}
            />
            <InputGlobal
              label="Quantidade de meses"
              type="number"
              inputMode="numeric"
              min={1}
              value={meses}
              onChange={(event) => setMeses(event.target.value)}
              error={errors.cobranca_qtd_meses}
            />
          </Grid>
          <AlertGlobal
            variant="info"
            message="Depois de salvar, gere as cobranças na tela Financeiro. Gerar de novo não duplica meses já criados."
          />
        </>
      )}
      {error && <AlertGlobal variant="error" message={error} />}
      <FormActionsGlobal>
        <ButtonGlobal label="Salvar rascunho" variant="outline" type="submit" loading={saving && !advance} disabled={saving} />
        <ButtonGlobal label="Salvar e continuar" loading={saving && advance} disabled={saving} onClick={() => save(true)} />
      </FormActionsGlobal>
    </Form>
  );
}

export type { IBillingFormProps } from './types';
