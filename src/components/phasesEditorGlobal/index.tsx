import { useMemo, useState } from 'react';
import type { IFaseForm } from '@/@types/phase';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { FormatSummaryGlobal } from '@/components/formatSummaryGlobal';
import { PhaseFormGlobal } from '@/components/phaseFormGlobal';
import { analyzeFormat, buildFormatSummary, issuesFor, newPhase, toPayload } from '@/utils/phaseFormat';
import { AddRow, PhaseList, Wrapper } from './style';
import type { IPhasesEditorProps } from './types';

// Etapa "Fases" do assistente (seção 5): fases em ordem, validação e resumo visual.
export function PhasesEditorGlobal({
  initialPhases,
  teamsCount,
  locked = false,
  notice,
  saving = false,
  error,
  onSave,
}: IPhasesEditorProps) {
  const [phases, setPhases] = useState<IFaseForm[]>(() => (initialPhases.length ? initialPhases : [newPhase(0)]));
  const [submitted, setSubmitted] = useState(false);
  const [advance, setAdvance] = useState(false);

  const analysis = useMemo(() => analyzeFormat(phases, teamsCount), [phases, teamsCount]);
  const summary = useMemo(() => buildFormatSummary(phases, analysis), [phases, analysis]);

  const update = (index: number, patch: Partial<IFaseForm>) =>
    setPhases((current) =>
      current.map((phase, i) => {
        if (i !== index) return phase;
        const next = { ...phase, ...patch };
        if (patch.tipo === 'mata_mata' && !next.cruzamento) next.cruzamento = 'por_campanha';
        return next;
      }),
    );

  const save = (goNext: boolean) => {
    setSubmitted(true);
    if (analysis.errors.length > 0) return;
    setAdvance(goNext);
    onSave(toPayload(phases), goNext);
  };

  const generalErrors = analysis.errors.filter((issue) => issue.phaseIndex === null);

  return (
    <Wrapper>
      {locked && (
        <AlertGlobal
          variant="warning"
          message="A estrutura está travada porque já há súmula lançada. Só o Admin pode alterar as fases."
        />
      )}
      {notice && <AlertGlobal variant="warning" message={notice} />}

      <PhaseList aria-label="Fases">
        {phases.map((phase, index) => {
          const errors = submitted ? issuesFor(analysis.errors, index).byField : {};
          const warnings = analysis.warnings.filter((w) => w.phaseIndex === index).map((w) => w.message);
          return (
            <PhaseFormGlobal
              key={phase.key}
              phase={phase}
              index={index}
              isLast={index === phases.length - 1}
              analysis={analysis.phases[index]}
              previousName={phases[index - 1]?.nome}
              earlierPhases={phases.slice(0, index).map((p, i) => ({
                ordem: i + 1,
                nome: p.nome.trim(),
                tipo: p.tipo,
                fase_origem: p.cruzamento === 'outra_fase' ? p.fase_origem : null,
              }))}
              previousClassificam={phases[index - 1]?.classificam}
              errors={errors}
              messages={warnings}
              disabled={locked}
              onChange={(patch) => update(index, patch)}
              onRemove={phases.length > 1 ? () => setPhases((c) => c.filter((_, i) => i !== index)) : undefined}
            />
          );
        })}
      </PhaseList>

      {!locked && (
        <AddRow>
          <ButtonGlobal
            label="Adicionar fase"
            variant="outline"
            onClick={() => setPhases((current) => [...current, newPhase(current.length, current.at(-1)?.tipo)])}
          />
        </AddRow>
      )}

      <CardGlobal title="Resumo do formato">
        <FormatSummaryGlobal steps={summary} />
      </CardGlobal>

      {submitted && analysis.errors.length > 0 && (
        <AlertGlobal variant="error" message="Corrija os pontos indicados nas fases antes de salvar." />
      )}
      {submitted && generalErrors.map((issue) => <AlertGlobal key={issue.message} variant="error" message={issue.message} />)}
      {error && <AlertGlobal variant="error" message={error} />}

      <FormActionsGlobal note="Ao salvar, os confrontos do mata-mata ficam gravados com as origens; os times entram quando a fase anterior termina.">
        <ButtonGlobal
          label="Salvar rascunho"
          variant="outline"
          loading={saving && !advance}
          disabled={saving || locked}
          onClick={() => save(false)}
        />
        <ButtonGlobal label="Salvar e continuar" loading={saving && advance} disabled={saving || locked} onClick={() => save(true)} />
      </FormActionsGlobal>
    </Wrapper>
  );
}

export type { IPhasesEditorProps } from './types';
