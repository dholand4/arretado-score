import type { ImageChange, IPessoaOpcao, ITimeInput } from '@/@types/competition';

export interface ITeamFormModalProps {
  open: boolean;
  initialValues?: ITimeInput & { logo_url: string | null };
  // Dono do time: só nome e logo.
  ownerMode?: boolean;
  donos?: IPessoaOpcao[];
  saving?: boolean;
  error?: string | null;
  onSubmit: (values: ITimeInput, logo: ImageChange) => void;
  onClose: () => void;
}
