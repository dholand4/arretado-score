import type { IFaseForm, IFasePayload } from '@/@types/phase';

export interface IPhasesEditorProps {
  initialPhases: IFaseForm[];
  teamsCount: number;
  // Admin com a estrutura travada: só leitura.
  locked?: boolean;
  // Aviso extra (ex.: master editando estrutura travada).
  notice?: string | null;
  saving?: boolean;
  error?: string | null;
  onSave: (fases: IFasePayload[], advance: boolean) => void;
}
