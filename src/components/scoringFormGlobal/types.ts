import type { ICompeticaoPontuacao, Modalidade } from '@/@types/competition';

export interface IScoringFormProps {
  initialValues: ICompeticaoPontuacao;
  modalidade: Modalidade;
  locked?: boolean;
  saving?: boolean;
  error?: string | null;
  onSave: (values: ICompeticaoPontuacao, advance: boolean) => void;
}
