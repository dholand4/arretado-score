import { Board, Score, Subtitle, Team } from './style';
import type { IScoreboardProps } from './types';

export function ScoreboardGlobal({ home, away, homeScore, awayScore, subtitle }: IScoreboardProps) {
  return (
    <Board role="status" aria-live="polite" aria-label={`Placar: ${home} ${homeScore} x ${awayScore} ${away}`}>
      <Team $align="right">{home}</Team>
      <Score>
        {homeScore} × {awayScore}
      </Score>
      <Team $align="left">{away}</Team>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </Board>
  );
}

export type { IScoreboardProps } from './types';
