import { useId } from 'react';
import { ErrorText, Field, Hint, Label, Textarea } from './style';
import type { ITextareaProps } from './types';

export function TextareaGlobal({ label, error, hint, id, ...rest }: ITextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  return (
    <Field>
      <Label htmlFor={textareaId}>{label}</Label>
      <Textarea id={textareaId} $invalid={Boolean(error)} aria-invalid={Boolean(error) || undefined} {...rest} />
      {error ? <ErrorText>{error}</ErrorText> : hint && <Hint>{hint}</Hint>}
    </Field>
  );
}

export type { ITextareaProps } from './types';
