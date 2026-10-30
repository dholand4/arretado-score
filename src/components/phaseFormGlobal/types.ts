import type { IFaseForm, TipoFase } from '@/@types/phase';
import type { IPhaseAnalysis } from '@/utils/phaseFormat';

export type PhaseFieldErrors = Partial<Record<keyof IFaseForm | 'confrontos', string>>;

export interface IPhaseFormProps {
  phase: IFaseForm;
  index: number;
  isLast: boolean;
  analysis?: IPhaseAnalysis;
  previousName?: string;
  // Fases anteriores, para escolher a origem com "Vencedores ou perdedores de uma fase".
  earlierPhases?: { ordem: number; nome: string; tipo: TipoFase; fase_origem: number | null }[];
  previousClassificam?: number | null;
  errors?: PhaseFieldErrors;
  messages?: string[];
  disabled?: boolean;
  onChange: (patch: Partial<IFaseForm>) => void;
  onRemove?: () => void;
}
