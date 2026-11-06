import type { IRegrasPartida } from '@/@types/liveSheet';

export interface IMatchRulesFormProps {
  initialValues: IRegrasPartida;
  saving?: boolean;
  error?: string | null;
  // advance: "Salvar e continuar" (vai para a próxima etapa do assistente).
  onSave: (values: IRegrasPartida, advance: boolean) => void;
}
