import type { ImageChange } from '@/@types/competition';

export interface IImageUploadProps {
  label: string;
  name: string;
  currentUrl?: string | null;
  value: ImageChange;
  onChange: (change: ImageChange) => void;
  shape?: 'circle' | 'square';
  disabled?: boolean;
}
