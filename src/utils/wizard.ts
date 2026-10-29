import { WIZARD_STEPS, type WizardStepKey } from '@/constants/competition';

export function isWizardStep(value: unknown): value is WizardStepKey {
  return WIZARD_STEPS.some((step) => step.key === value && step.available);
}

// Próxima etapa disponível (pula as que ainda não existem).
export function nextWizardStep(current: WizardStepKey): WizardStepKey {
  const index = WIZARD_STEPS.findIndex((step) => step.key === current);
  const next = WIZARD_STEPS.slice(index + 1).find((step) => step.available);
  return next?.key ?? current;
}
