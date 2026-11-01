import type { IRegrasPartida } from '@/@types/liveSheet';

export interface IMatchRulesFormProps {
  initialValues: IRegrasPartida;
  saving?: boolean;
  error?: string | null;
  saved?: boolean;
  onSave: (values: IRegrasPartida) => void;
}
