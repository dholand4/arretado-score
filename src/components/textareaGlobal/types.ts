import type { TextareaHTMLAttributes } from 'react';

export interface ITextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
  hint?: string;
}
