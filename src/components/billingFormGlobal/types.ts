import type { ICompeticaoCobranca } from '@/@types/finance';

export interface IBillingFormProps {
  initialValues: ICompeticaoCobranca;
  saving?: boolean;
  error?: string | null;
  onSave: (values: ICompeticaoCobranca, advance: boolean) => void;
}
