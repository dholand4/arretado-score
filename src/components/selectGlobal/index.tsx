import { useId } from 'react';
import { ErrorText, Field, Label, Select } from './style';
import type { ISelectProps } from './types';

export function SelectGlobal({ label, options, error, id, ...rest }: ISelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field>
      <Label htmlFor={selectId}>{label}</Label>
      <Select
        id={selectId}
        $invalid={Boolean(error)}
        aria-invalid={Boolean(error) || undefined}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error && <ErrorText>{error}</ErrorText>}
    </Field>
  );
}

export type { ISelectOption, ISelectProps } from './types';
