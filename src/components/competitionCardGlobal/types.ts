import type { Modalidade, StatusCompeticao } from '@/@types/competition';
import type { RoutePath } from '@/routes/types';

export interface ICompetitionCardProps {
  nome: string;
  modalidade: Modalidade;
  status: StatusCompeticao;
  logoUrl?: string | null;
  meta?: string;
  to?: RoutePath;
  // Liga desativada: etiqueta e card esmaecido.
  inactive?: boolean;
}
