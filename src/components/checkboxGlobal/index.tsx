import { Box, Description, Label, Texts, Wrapper } from './style';
import type { ICheckboxProps } from './types';

export function CheckboxGlobal({ label, description, ...rest }: ICheckboxProps) {
  return (
    <Wrapper>
      <Box type="checkbox" {...rest} />
      <Texts>
        <Label>{label}</Label>
        {description && <Description>{description}</Description>}
      </Texts>
    </Wrapper>
  );
}

export type { ICheckboxProps } from './types';
