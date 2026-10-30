import type { ICompeticaoPontuacao } from '@/@types/competition';

export interface IScoringFormProps {
  initialValues: ICompeticaoPontuacao;
  locked?: boolean;
  warnRecalculation?: boolean;
  saving?: boolean;
  error?: string | null;
  onSave: (values: ICompeticaoPontuacao, advance: boolean) => void;
}
