import type { IDistribuicaoGrupos } from '@/@types/phase';

export interface IGroupsDistributionModalProps {
  open: boolean;
  groupNames: string[];
  teams: { id: string; nome: string }[];
  initial?: IDistribuicaoGrupos;
  saving?: boolean;
  error?: string | null;
  confirmLabel?: string;
  onConfirm: (distribuicao: IDistribuicaoGrupos) => void;
  onClose: () => void;
}
