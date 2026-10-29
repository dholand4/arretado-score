import { useId } from 'react';
import { ErrorText, Field, Hint, Input, Label, Row } from './style';
import type { IInputProps } from './types';

export function InputGlobal({ label, error, hint, action, id, ...rest }: IInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <Field>
      <Label htmlFor={inputId}>{label}</Label>
      <Row>
        <Input
          id={inputId}
          $invalid={Boolean(error)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {action}
      </Row>
      {error ? (
        <ErrorText id={`${inputId}-error`}>{error}</ErrorText>
      ) : (
        hint && <Hint id={`${inputId}-hint`}>{hint}</Hint>
      )}
    </Field>
  );
}

export type { IInputProps } from './types';
