import type { IContatoEquipe, ImageChange, INovoDonoInput, IPessoaOpcao, ITimeInput } from '@/@types/competition';

export interface ITeamFormModalProps {
  open: boolean;
  initialValues?: ITimeInput & { logo_url: string | null };
  // Dono do time: só nome e logo.
  ownerMode?: boolean;
  donos?: IPessoaOpcao[];
  saving?: boolean;
  error?: string | null;
  // novoDono: login da equipe criado junto com o time; contato: telefone novo da equipe já cadastrada.
  onSubmit: (values: ITimeInput, logo: ImageChange, novoDono?: INovoDonoInput, contato?: IContatoEquipe) => void;
  onClose: () => void;
}
