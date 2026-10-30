import type { Cruzamento, IConfronto, MelhorDe, ResultadoOrigem, SorteioGrupos, TipoFase } from '@/@types/phase';
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
  RESULTADO_ORIGEM_OPTIONS,
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
  earlierPhases = [],
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
  const knockoutBefore = earlierPhases.filter((p) => p.tipo === 'mata_mata');
  // "Vencedores ou perdedores de uma fase" só aparece quando já existe um mata-mata antes.
  const cruzamentoOptions = CRUZAMENTO_OPTIONS.filter((o) => o.value !== 'outra_fase' || knockoutBefore.length > 0);
  const fromOther = isKnockout && phase.cruzamento === 'outra_fase';

  const changeCruzamento = (cruzamento: Cruzamento | null) =>
    onChange(
      cruzamento === 'outra_fase'
        ? {
            cruzamento,
            // Logo depois de um "3º lugar", a final costuma sair da mesma fase de origem dele.
            fase_origem: phase.fase_origem ?? earlierPhases.at(-1)?.fase_origem ?? knockoutBefore.at(-1)?.ordem ?? null,
            resultado_origem: phase.resultado_origem ?? (isLast ? 'vencedores' : 'perdedores'),
          }
        : { cruzamento },
    );

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
              options={[{ value: '', label: 'Escolha…' }, ...cruzamentoOptions]}
              disabled={structureDisabled}
              error={errors.cruzamento}
              onChange={(e) => changeCruzamento((e.target.value || null) as Cruzamento | null)}
            />
            {!isLast && (
              <InputGlobal
                label="Melhores perdedores"
                type="number"
                inputMode="numeric"
                min={0}
                value={toText(phase.melhores_extras)}
                disabled={disabled}
                error={errors.melhores_extras}
                hint="Quantos perdedores também avançam, quando os vencedores não fecham a próxima fase (ex.: 3 vencedores + 1 = 4)."
                onChange={(e) => onChange({ melhores_extras: toNumber(e.target.value) ?? 0 })}
              />
            )}
          </>
        )}

        {fromOther && (
          <>
            <SelectGlobal
              label="Fase de origem"
              value={phase.fase_origem === null ? '' : String(phase.fase_origem)}
              options={[
                { value: '', label: 'Escolha…' },
                ...knockoutBefore.map((p) => ({ value: String(p.ordem), label: p.nome || `Fase ${p.ordem}` })),
              ]}
              disabled={structureDisabled}
              error={errors.fase_origem}
              onChange={(e) => onChange({ fase_origem: toNumber(e.target.value) })}
            />
            <SelectGlobal
              label="Quem entra"
              value={phase.resultado_origem ?? ''}
              options={[{ value: '', label: 'Escolha…' }, ...RESULTADO_ORIGEM_OPTIONS]}
              disabled={structureDisabled}
              error={errors.resultado_origem}
              onChange={(e) => onChange({ resultado_origem: (e.target.value || null) as ResultadoOrigem | null })}
            />
          </>
        )}
      </Fields>

      {!isKnockout && isLast && <Info>Última fase: o 1º colocado é o campeão.</Info>}
      {isKnockout && phase.cruzamento && <Info>{CRUZAMENTO_LABEL[phase.cruzamento].description}</Info>}
      {isKnockout && analysis?.entram !== null && analysis?.entram !== undefined && (
        <Info>
          Chegam {pluralize(analysis.entram, 'time', 'times')} {fromOther ? 'da fase escolhida' : 'da fase anterior'} →{' '}
          {pluralize(Math.floor(analysis.entram / 2), 'confronto', 'confrontos')}.
        </Info>
      )}
      {isKnockout && !isLast && phase.melhores_extras > 0 && (
        <Info>
          Avançam os vencedores e{' '}
          {phase.melhores_extras === 1 ? 'o melhor perdedor' : `os ${phase.melhores_extras} melhores perdedores`}: quem perdeu
          algum jogo por W.O. fica atrás; depois contam vitórias na série, saldo, pontos marcados e a campanha anterior. Na fase
          seguinte, os melhores perdedores entram depois dos vencedores.
        </Info>
      )}

      {/* Formato antigo: o 3º lugar agora é uma fase com os perdedores da semifinal. */}
      {isKnockout && phase.disputa_terceiro && (
        <CheckboxGlobal
          label="Disputa de 3º lugar"
          description="Formato antigo. Prefira uma fase de 3º lugar com os perdedores da semifinal."
          checked={phase.disputa_terceiro}
          disabled={structureDisabled}
          onChange={(e) => onChange({ disputa_terceiro: e.target.checked })}
        />
      )}

      {isKnockout && phase.disputa_terceiro && (
        <SelectGlobal
          label="Série do 3º lugar"
          value={phase.melhor_de_terceiro === null ? '' : String(phase.melhor_de_terceiro)}
          options={[
            { value: '', label: 'Igual à desta fase' },
            ...MELHOR_DE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label })),
          ]}
          disabled={structureDisabled}
          onChange={(e) => onChange({ melhor_de_terceiro: e.target.value ? (Number(e.target.value) as MelhorDe) : null })}
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
