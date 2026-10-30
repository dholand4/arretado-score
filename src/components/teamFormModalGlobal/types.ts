import type { ImageChange, INovoDonoInput, IPessoaOpcao, ITimeInput } from '@/@types/competition';

export interface ITeamFormModalProps {
  open: boolean;
  initialValues?: ITimeInput & { logo_url: string | null };
  // Dono do time: só nome e logo.
  ownerMode?: boolean;
  donos?: IPessoaOpcao[];
  saving?: boolean;
  error?: string | null;
  // novoDono: login do dono criado junto com o time (só no cadastro de time novo).
  onSubmit: (values: ITimeInput, logo: ImageChange, novoDono?: INovoDonoInput) => void;
  onClose: () => void;
}
