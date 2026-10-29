import type { ICategoria, ICategoriaInput } from '@/@types/competition';

export interface ICategoriesEditorProps {
  categories: ICategoria[];
  busy?: boolean;
  error?: string | null;
  onCreate: (values: ICategoriaInput, done: () => void) => void;
  onUpdate: (id: string, patch: Partial<ICategoriaInput & { ativa: boolean }>, done?: () => void) => void;
  onRemove: (id: string, done: () => void) => void;
  onMove: (a: ICategoria, b: ICategoria) => void;
  onClearError?: () => void;
}
