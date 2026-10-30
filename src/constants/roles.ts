import type { Papel } from '@/@types/user';

export const PAPEL_LABEL: Record<Papel, string> = {
  master: 'Admin',
  admin: 'Coordenador',
  dono_time: 'Equipe',
};

export const PAPEL_OPTIONS: { value: Papel; label: string }[] = [
  { value: 'admin', label: PAPEL_LABEL.admin },
  { value: 'dono_time', label: PAPEL_LABEL.dono_time },
  { value: 'master', label: PAPEL_LABEL.master },
];
