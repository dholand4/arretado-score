import { Group, Option } from './style';
import type { ISegmentedProps } from './types';

// Escolha única entre poucas opções (ex.: tipo de lançamento, fase da tabela).
export function SegmentedGlobal<T extends string>({ ariaLabel, options, value, onChange, disabled }: ISegmentedProps<T>) {
  return (
    <Group role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <Option
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          $active={option.value === value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Option>
      ))}
    </Group>
  );
}

export type { ISegmentedOption, ISegmentedProps } from './types';
