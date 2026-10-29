import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { ICompeticao, ICompeticaoBasicos } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { BasicInfoFormGlobal } from '@/components/basicInfoFormGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { CategoriesEditorGlobal } from '@/components/categoriesEditorGlobal';
import { CompetitionReviewGlobal } from '@/components/competitionReviewGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { FormActionsGlobal } from '@/components/formActionsGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { ScoringFormGlobal } from '@/components/scoringFormGlobal';
import { StepperGlobal } from '@/components/stepperGlobal';
import { INTERVALO_PADRAO_MIN, WIZARD_STEPS, type WizardStepKey } from '@/constants/competition';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useCompetition, useCreateCompetition } from '@/hooks/useCompetitions';
import { useTeams } from '@/hooks/useTeams';
import type { IRouteParams } from '@/routes/types';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { isWizardStep, nextWizardStep } from '@/utils/wizard';
import { Feedback } from './style';

const STEPS = WIZARD_STEPS.map((step) => ({
  key: step.key,
  label: step.label,
  disabled: !step.available,
  hint: step.available ? undefined : 'Disponível numa próxima etapa',
}));

const EMPTY_BASICS: ICompeticaoBasicos = {
  nome: '',
  slug: '',
  modalidade: 'basquete',
  descricao: '',
  local_padrao: '',
  intervalo_jogos_min: INTERVALO_PADRAO_MIN,
};

const toBasics = (c: ICompeticao): ICompeticaoBasicos => ({
  nome: c.nome,
  slug: c.slug,
  modalidade: c.modalidade,
  descricao: c.descricao ?? '',
  local_padrao: c.local_padrao ?? '',
  intervalo_jogos_min: c.intervalo_jogos_min,
});

function NewCompetitionWizard() {
  const navigate = useAppNavigate();
  const create = useCreateCompetition();

  return (
    <>
      <PageHeaderGlobal title="Nova competição" subtitle="Comece pelos dados básicos; o resto pode ser ajustado depois." />
      <StepperGlobal
        steps={STEPS.map((s) => ({ ...s, disabled: s.key !== 'dados' }))}
        current="dados"
        onSelect={() => {}}
      />
      <BasicInfoFormGlobal
        initialValues={EMPTY_BASICS}
        isNew
        saving={create.isPending}
        error={create.error ? getErrorMessage(create.error) : null}
        onSave={(input, logo, advance) =>
          create.mutate(
            { input, logo },
            { onSuccess: (id) => navigate(paths.competitionSettings(id, advance ? 'pontuacao' : 'dados'), { replace: true }) },
          )
        }
      />
    </>
  );
}

function EditCompetitionWizard({ competitionId }: { competitionId: string }) {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const etapa = searchParams.get('etapa');
  const step: WizardStepKey = isWizardStep(etapa) ? etapa : 'dados';
  const [saved, setSaved] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const { competition, isLoading, error, refetch, saveBasics, saveScoring } = useCompetition(competitionId);
  const categories = useCategories(competitionId);
  const { teams } = useTeams(competitionId);

  const goTo = (key: WizardStepKey) => {
    setSaved(false);
    setSearchParams({ etapa: key });
  };
  const afterSave = (advance: boolean) => (advance ? goTo(nextWizardStep(step)) : setSaved(true));
  const onCategoryError = (err: unknown) => setCategoryError(getErrorMessage(err));

  if (isLoading || categories.isLoading) return <LoaderGlobal label="Carregando competição" />;
  if (error || !competition) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  const locked = competition.estrutura_travada && profile?.papel !== 'master';

  return (
    <>
      <PageHeaderGlobal title="Configuração" subtitle={competition.nome} />
      <StepperGlobal steps={STEPS} current={step} onSelect={(key) => goTo(key as WizardStepKey)} />
      {saved && (
        <Feedback>
          <AlertGlobal variant="success" message="Rascunho salvo." onClose={() => setSaved(false)} />
        </Feedback>
      )}

      {step === 'dados' && (
        <BasicInfoFormGlobal
          key={`dados-${competition.id}`}
          initialValues={toBasics(competition)}
          logoUrl={competition.logo_url}
          isNew={false}
          saving={saveBasics.isPending}
          error={saveBasics.error ? getErrorMessage(saveBasics.error) : null}
          onSave={(input, logo, advance) => saveBasics.mutate({ input, logo }, { onSuccess: () => afterSave(advance) })}
        />
      )}

      {step === 'pontuacao' && (
        <ScoringFormGlobal
          key={`pontuacao-${competition.id}`}
          initialValues={competition}
          modalidade={competition.modalidade}
          locked={locked}
          saving={saveScoring.isPending}
          error={saveScoring.error ? getErrorMessage(saveScoring.error) : null}
          onSave={(input, advance) => saveScoring.mutate(input, { onSuccess: () => afterSave(advance) })}
        />
      )}

      {step === 'estatisticas' && (
        <>
          <CategoriesEditorGlobal
            categories={categories.categories}
            busy={
              categories.createCategory.isPending ||
              categories.updateCategory.isPending ||
              categories.removeCategory.isPending ||
              categories.moveCategory.isPending
            }
            error={categoryError}
            onClearError={() => setCategoryError(null)}
            onCreate={(values, done) =>
              categories.createCategory.mutate(values, { onSuccess: done, onError: onCategoryError })
            }
            onUpdate={(id, patch, done) =>
              categories.updateCategory.mutate({ id, patch }, { onSuccess: done, onError: onCategoryError })
            }
            onRemove={(id, done) => categories.removeCategory.mutate(id, { onSuccess: done, onError: onCategoryError })}
            onMove={(a, b) => categories.moveCategory.mutate({ a, b }, { onError: onCategoryError })}
          />
          <FormActionsGlobal note="As alterações desta etapa são salvas na hora. Cada estatística ativa ganha um ranking.">
            <ButtonGlobal label="Continuar" onClick={() => goTo(nextWizardStep(step))} />
          </FormActionsGlobal>
        </>
      )}

      {step === 'revisao' && (
        <>
          <CompetitionReviewGlobal
            competition={competition}
            categories={categories.categories}
            teamsCount={teams.length}
            onEditStep={goTo}
          />
          <FormActionsGlobal>
            <LinkButtonGlobal to={paths.competitionTeams(competitionId)} label="Ir para os times" variant="primary" />
          </FormActionsGlobal>
        </>
      )}
    </>
  );
}

export function CompetitionWizardScreen() {
  const { competitionId } = useParams<Partial<IRouteParams>>();
  return competitionId ? (
    <EditCompetitionWizard key={competitionId} competitionId={competitionId} />
  ) : (
    <NewCompetitionWizard />
  );
}
