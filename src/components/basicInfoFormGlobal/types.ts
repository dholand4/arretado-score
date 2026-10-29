import type { ICompeticaoBasicos, ImageChange } from '@/@types/competition';

export interface IBasicInfoFormProps {
  initialValues: ICompeticaoBasicos;
  logoUrl?: string | null;
  isNew: boolean;
  saving?: boolean;
  error?: string | null;
  onSave: (values: ICompeticaoBasicos, logo: ImageChange, advance: boolean) => void;
}
