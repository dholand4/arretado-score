import { BadgeGlobal } from '@/components/badgeGlobal';
import { Action, Card, Footer, Matchup, Score, Team } from './style';
import type { IGameCardProps } from './types';

export function GameCardGlobal({
  to,
  home,
  away,
  homeScore,
  awayScore,
  statusLabel,
  statusTone,
  description,
  actionLabel,
}: IGameCardProps) {
  return (
    <Card to={to}>
      <Matchup>
        <Team $align="right">{home}</Team>
        <Score>
          {homeScore ?? '–'} × {awayScore ?? '–'}
        </Score>
        <Team $align="left">{away}</Team>
      </Matchup>
      <Footer>
        <span>{description}</span>
        <BadgeGlobal label={statusLabel} tone={statusTone} />
      </Footer>
      <Action>{actionLabel} →</Action>
    </Card>
  );
}

export type { IGameCardProps } from './types';
