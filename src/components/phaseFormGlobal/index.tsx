import type { Cruzamento, IConfronto, MelhorDe, SorteioGrupos, TipoFase } from '@/@types/phase';
import { AlertGlobal } from '@/components/alertGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { CheckboxGlobal } from '@/components/checkboxGlobal';
import { InputGlobal } from '@/components/inputGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import {
  CRUZAMENTO_LABEL,
  CRUZAMENTO_OPTIONS,
  MELHOR_DE_OPTIONS,
  SORTEIO_GRUPOS_LABEL,
  TIPO_FASE_OPTIONS,
} from '@/constants/phase';
import { originKey, originLabel } from '@/utils/phaseFormat';
import { pluralize } from '@/utils/text';
import { Code, Fields, Header, Info, Matchup, MatchupLegend, Messages, SeriesList } from './style';
import type { IPhaseFormProps } from './types';

const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));
const toText = (value: number | null) => (value === null || Number.isNaN(value) ? '' : String(value));

export function PhaseFormGlobal({
  phase,
  index,
  isLast,
  analysis,
  previousName = '',
  previousClassificam = null,
  errors = {},
  messages = [],
  disabled = false,
  onChange,
  onRemove,
}: IPhaseFormProps) {
  // Fase que já começou: só nome e classificados podem mudar.
  const structureDisabled = disabled || phase.iniciada;
  const isGroups = phase.tipo === 'grupos';
  const isKnockout = phase.tipo === 'mata_mata';
  const tipoOptions = index === 0 ? TIPO_FASE_OPTIONS.filter((o) => o.value !== 'mata_mata') : TIPO_FASE_OPTIONS;
  const label = (o: Parameters<typeof originLabel>[0]) => originLabel(o, previousName, previousClassificam);

  const setConfronto = (k: number, side: keyof IConfronto, key: string) => {
    const origem = analysis?.origens.find((o) => o.key === key)?.origem ?? null;
    const total = Math.max(analysis?.confrontosNecessarios ?? 0, phase.confrontos.length, k + 1);
    const next = Array.from({ length: total }, (_, i) => phase.confrontos[i] ?? { origem_a: null, origem_b: null });
    next[k] = { ...next[k], [side]: origem };
    onChange({ confrontos: next });
  };

  const originOptions = [
    { value: '', label: 'Escolha…' },
    ...(analysis?.origens ?? []).map((o) => ({ value: o.key, label: o.label })),
  ];

  return (
    <CardGlobal
      as="li"
      title={`Fase ${index + 1}`}
      actions={
        <Header>
          {phase.iniciada && <BadgeGlobal label="Já começou" tone="info" />}
          {onRemove && (
            <ButtonGlobal
              label="Remover"
              size="sm"
              variant="ghost"
              disabled={structureDisabled}
              onClick={onRemove}
              aria-label={`Remover fase ${index + 1}`}
            />
          )}
        </Header>
      }
    >
      <Fields>
        <InputGlobal
          label="Nome da fase"
          value={phase.nome}
          maxLength={60}
          disabled={disabled}
          error={errors.nome}
          onChange={(e) => onChange({ nome: e.target.value })}
        />
        <SelectGlobal
          label="Tipo"
          value={phase.tipo}
          options={tipoOptions}
          disabled={structureDisabled}
          error={errors.tipo}
          onChange={(e) => onChange({ tipo: e.target.value as TipoFase })}
        />

        {!isKnockout && (
          <SelectGlobal
            label="Turnos"
            value={String(phase.turnos)}
            options={[
              { value: '1', label: '1 turno' },
              { value: '2', label: '2 turnos (ida e volta)' },
            ]}
            disabled={structureDisabled}
            onChange={(e) => onChange({ turnos: e.target.value === '2' ? 2 : 1 })}
          />
        )}

        {isGroups && (
          <>
            <InputGlobal
              label="Quantidade de grupos"
              type="number"
              inputMode="numeric"
              min={2}
              value={toText(phase.qtd_grupos)}
              disabled={structureDisabled}
              error={errors.qtd_grupos}
              onChange={(e) => onChange({ qtd_grupos: toNumber(e.target.value) })}
            />
            <SelectGlobal
              label="Como os grupos são definidos"
              value={phase.sorteio_grupos}
              options={(Object.keys(SORTEIO_GRUPOS_LABEL) as SorteioGrupos[]).map((value) => ({
                value,
                label: SORTEIO_GRUPOS_LABEL[value],
              }))}
              disabled={structureDisabled}
              onChange={(e) => onChange({ sorteio_grupos: e.target.value as SorteioGrupos })}
            />
          </>
        )}

        {!isKnockout && !isLast && (
          <InputGlobal
            label={isGroups ? 'Avançam por grupo' : 'Quantos avançam'}
            type="number"
            inputMode="numeric"
            min={1}
            value={toText(phase.classificam)}
            disabled={disabled}
            error={errors.classificam}
            onChange={(e) => onChange({ classificam: toNumber(e.target.value) })}
          />
        )}

        {isGroups && !isLast && (
          <InputGlobal
            label="Melhores extras"
            type="number"
            inputMode="numeric"
            min={0}
            value={toText(phase.melhores_extras)}
            disabled={disabled}
            error={errors.melhores_extras}
            hint={`Quantos melhores ${(phase.classificam ?? 0) + 1}º colocados também avançam.`}
            onChange={(e) => onChange({ melhores_extras: toNumber(e.target.value) ?? 0 })}
          />
        )}

        {isKnockout && (
          <>
            <SelectGlobal
              label="Série"
              value={String(phase.melhor_de)}
              options={MELHOR_DE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
              disabled={structureDisabled}
              onChange={(e) => onChange({ melhor_de: Number(e.target.value) as MelhorDe })}
            />
            <SelectGlobal
              label="Confrontos"
              value={phase.cruzamento ?? ''}
              options={[{ value: '', label: 'Escolha…' }, ...CRUZAMENTO_OPTIONS]}
              disabled={structureDisabled}
              error={errors.cruzamento}
              onChange={(e) => onChange({ cruzamento: (e.target.value || null) as Cruzamento | null })}
            />
          </>
        )}
      </Fields>

      {!isKnockout && isLast && <Info>Última fase: o 1º colocado é o campeão.</Info>}
      {isKnockout && phase.cruzamento && <Info>{CRUZAMENTO_LABEL[phase.cruzamento].description}</Info>}
      {isKnockout && analysis?.entram !== null && analysis?.entram !== undefined && (
        <Info>
          Chegam {pluralize(analysis.entram, 'time', 'times')} da fase anterior →{' '}
          {pluralize(Math.floor(analysis.entram / 2), 'confronto', 'confrontos')}.
        </Info>
      )}

      {isKnockout && (analysis?.entram === 2 || phase.disputa_terceiro) && (
        <CheckboxGlobal
          label="Disputa de 3º lugar"
          description="Cria também a série entre os perdedores das semifinais."
          checked={phase.disputa_terceiro}
          disabled={structureDisabled}
          onChange={(e) => onChange({ disputa_terceiro: e.target.checked })}
        />
      )}

      {isKnockout && phase.cruzamento === 'manual' && analysis && analysis.confrontosNecessarios > 0 && (
        <Messages>
          {Array.from({ length: analysis.confrontosNecessarios }, (_, k) => {
            const c = phase.confrontos[k];
            return (
              <Matchup key={k} disabled={structureDisabled}>
                <MatchupLegend>Confronto {k + 1}</MatchupLegend>
                <SelectGlobal
                  label="Melhor campanha"
                  value={c?.origem_a ? originKey(c.origem_a) : ''}
                  options={originOptions}
                  onChange={(e) => setConfronto(k, 'origem_a', e.target.value)}
                />
                <SelectGlobal
                  label="Adversário"
                  value={c?.origem_b ? originKey(c.origem_b) : ''}
                  options={originOptions}
                  onChange={(e) => setConfronto(k, 'origem_b', e.target.value)}
                />
              </Matchup>
            );
          })}
          {errors.confrontos && <AlertGlobal variant="error" message={errors.confrontos} />}
        </Messages>
      )}

      {isKnockout && phase.cruzamento !== 'manual' && analysis && analysis.series.length > 0 && (
        <SeriesList aria-label={`Séries da fase ${index + 1}`}>
          {analysis.series.map((s) => (
            <li key={s.codigo}>
              <Code>{s.codigo}</Code>
              {s.terceiro ? ' (3º lugar)' : ''}: {label(s.origem_a)} x {label(s.origem_b)}
            </li>
          ))}
        </SeriesList>
      )}

      {errors.disputa_terceiro && <AlertGlobal variant="error" message={errors.disputa_terceiro} />}
      {messages.length > 0 && (
        <Messages>
          {messages.map((m) => (
            <AlertGlobal key={m} variant="warning" message={m} />
          ))}
        </Messages>
      )}
    </CardGlobal>
  );
}

export type { IPhaseFormProps, PhaseFieldErrors } from './types';
