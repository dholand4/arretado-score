import type { InputHTMLAttributes, ReactNode } from 'react';

export interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
  action?: ReactNode;
}
