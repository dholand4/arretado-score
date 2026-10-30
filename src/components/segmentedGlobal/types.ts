export interface ISegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface ISegmentedProps<T extends string> {
  ariaLabel: string;
  options: ISegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}
