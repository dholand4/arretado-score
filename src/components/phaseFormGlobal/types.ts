import type { IFaseForm } from '@/@types/phase';
import type { IPhaseAnalysis } from '@/utils/phaseFormat';

export type PhaseFieldErrors = Partial<Record<keyof IFaseForm | 'confrontos', string>>;

export interface IPhaseFormProps {
  phase: IFaseForm;
  index: number;
  isLast: boolean;
  analysis?: IPhaseAnalysis;
  previousName?: string;
  previousClassificam?: number | null;
  errors?: PhaseFieldErrors;
  messages?: string[];
  disabled?: boolean;
  onChange: (patch: Partial<IFaseForm>) => void;
  onRemove?: () => void;
}
