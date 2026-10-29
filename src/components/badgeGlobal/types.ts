export type BadgeTone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info';

export interface IBadgeProps {
  label: string;
  tone?: BadgeTone;
}
