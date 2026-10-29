import type { ISummaryStep } from '@/@types/phase';

export interface ICompetitionStartProps {
  steps: ISummaryStep[];
  // Motivos que impedem iniciar (ex.: "Cadastre ao menos 2 times").
  blockers: string[];
  starting?: boolean;
  onStart: () => void;
}
