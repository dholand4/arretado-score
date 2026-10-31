import { BadgeGlobal } from '@/components/badgeGlobal';
import { Action, Card, Footer, Matchup, Order, Score, Team } from './style';
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
  order,
  actionLabel,
}: IGameCardProps) {
  return (
    <Card to={to}>
      {order && <Order>{order}</Order>}
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
      {actionLabel && <Action>{actionLabel} →</Action>}
    </Card>
  );
}

export type { IGameCardProps } from './types';
