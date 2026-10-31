import { useId, useState, type FormEvent } from 'react';
import type { IEventoInput } from '@/@types/event';
import { AlertGlobal } from '@/components/alertGlobal';
import { CheckboxGlobal } from '@/components/checkboxGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { TextareaGlobal } from '@/components/textareaGlobal';
import { hasErrors, parseIntField, type FormErrors } from '@/utils/competitionValidators';
import { validateEvent } from '@/utils/eventSchedule';
import { pluralize } from '@/utils/text';
import { ErrorText, Fieldset, Form, Hint, Legend, Missing, MissingList, QuickActions, Row, TeamsGrid } from './style';
import type { IEventFormModalProps } from './types';

type NumberField = 'qtd_jogos' | 'intervalo_min';

// Novo dia de jogos (seção 6.2): local e intervalo vêm preenchidos com os padrões da competição.
// Em modo edição, muda só data, hora, local, intervalo e observações de um dia já montado.
export function EventFormModalGlobal({
  open,
  mode = 'create',
  initialValues,
  teams = [],
  missingGames = [],
  saving = false,
  error,
  onSubmit,
  onClose,
}: IEventFormModalProps) {
  const formId = useId();
  const editing = mode === 'edit';
  const [values, setValues] = useState(initialValues);
  const [numbers, setNumbers] = useState<Record<NumberField, string>>({
    qtd_jogos: String(initialValues.qtd_jogos),
    intervalo_min: String(initialValues.intervalo_min),
  });
  const [errors, setErrors] = useState<FormErrors<IEventoInput>>({});
  // Times que vão estar no dia (todos marcados de início).
  const [selected, setSelected] = useState<string[]>(initialValues.times ?? teams.map((t) => t.id));

  // Quantidade de jogos: segue os jogos que faltam entre os times marcados até o admin digitar outra.
  const [qtdEditada, setQtdEditada] = useState(false);

  const toggleTeam = (id: string, checked: boolean) => {
    setQtdEditada(false);
    setSelected((current) => (checked ? [...current, id] : current.filter((t) => t !== id)));
  };

  // Jogos que faltam e só envolvem times escolhidos: é deles que o sorteio vai tirar o dia.
  const possiveis = missingGames.filter((g) => selected.includes(g.timeCasaId) && selected.includes(g.timeForaId));
  const autoQtd = !qtdEditada && selected.length < teams.length && possiveis.length > 0;
  const qtdJogos = autoQtd ? String(possiveis.length) : numbers.qtd_jogos;

  const set = (field: keyof IEventoInput, value: string) => setValues((v) => ({ ...v, [field]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: IEventoInput = {
      ...values,
      local: values.local.trim(),
      observacoes: values.observacoes.trim(),
      qtd_jogos: parseIntField(qtdJogos),
      intervalo_min: parseIntField(numbers.intervalo_min),
      times: !editing && teams.length > 0 && selected.length < teams.length ? selected : null,
    };
    const found = validateEvent(payload);
    setErrors(found);
    if (hasErrors(found)) return;
    onSubmit(payload);
  };

  return (
    <ModalGlobal
      open={open}
      title={editing ? 'Editar dia de jogos' : 'Lançar jogos'}
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={saving} />
          <ButtonGlobal label={editing ? 'Salvar' : 'Lançar'} type="submit" form={formId} loading={saving} />
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
          {!editing && (
            <InputGlobal
              label="Quantidade de jogos"
              type="number"
              inputMode="numeric"
              min={1}
              value={qtdJogos}
              error={errors.qtd_jogos}
              hint={autoQtd ? 'Preenchida com os jogos que faltam entre os times marcados.' : undefined}
              onChange={(e) => {
                setQtdEditada(true);
                setNumbers((n) => ({ ...n, qtd_jogos: e.target.value }));
              }}
            />
          )}
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
        {editing && <Hint>Os jogos e a ordem continuam os mesmos; os horários são recalculados a partir do novo início.</Hint>}
        {!editing && teams.length > 0 && (
          <Fieldset>
            <Legend>Times que vão jogar no dia</Legend>
            <QuickActions>
              <ButtonGlobal
                label="Todos"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQtdEditada(false);
                  setSelected(teams.map((t) => t.id));
                }}
              />
              <ButtonGlobal
                label="Nenhum"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQtdEditada(false);
                  setSelected([]);
                }}
              />
            </QuickActions>
            <TeamsGrid>
              {teams.map((team) => (
                <CheckboxGlobal
                  key={team.id}
                  label={team.nome}
                  checked={selected.includes(team.id)}
                  onChange={(e) => toggleTeam(team.id, e.target.checked)}
                />
              ))}
            </TeamsGrid>
            {errors.times && <ErrorText>{errors.times}</ErrorText>}
            <Missing aria-live="polite">
              <strong>
                {possiveis.length === 0
                  ? 'Não falta nenhum jogo entre esses times.'
                  : `Faltam ${pluralize(possiveis.length, 'jogo', 'jogos')} entre esses times:`}
              </strong>
              {possiveis.length > 0 && (
                <MissingList>
                  {possiveis.map((g) => (
                    <li key={g.id}>{g.confronto}</li>
                  ))}
                </MissingList>
              )}
            </Missing>
          </Fieldset>
        )}
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
