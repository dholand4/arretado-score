import type { ICategoria, ICompeticao } from '@/@types/competition';
import type { WizardStepKey } from '@/constants/competition';

export interface ICompetitionReviewProps {
  competition: ICompeticao;
  categories: ICategoria[];
  teamsCount: number;
  onEditStep: (step: WizardStepKey) => void;
}
