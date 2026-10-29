export interface IStep {
  key: string;
  label: string;
  disabled?: boolean;
  hint?: string;
}

export interface IStepperProps {
  steps: IStep[];
  current: string;
  onSelect: (key: string) => void;
}
