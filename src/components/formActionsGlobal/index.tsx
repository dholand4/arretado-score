import { Bar, Buttons, Note } from './style';
import type { IFormActionsProps } from './types';

export function FormActionsGlobal({ children, note }: IFormActionsProps) {
  return (
    <Bar>
      {note && <Note>{note}</Note>}
      <Buttons>{children}</Buttons>
    </Bar>
  );
}

export type { IFormActionsProps } from './types';
