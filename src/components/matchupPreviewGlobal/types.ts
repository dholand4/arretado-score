import type { IPreviewRound } from '@/hooks/useGamesPreview';

export interface IMatchupPreviewProps {
  title: string;
  rounds: IPreviewRound[];
  note?: string;
}
