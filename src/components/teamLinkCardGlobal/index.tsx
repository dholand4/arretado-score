import { AvatarGlobal } from '@/components/avatarGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { Meta, Name, TeamLink, Texts } from './style';
import type { ITeamLinkCardProps } from './types';

export function TeamLinkCardGlobal({ to, name, logoUrl, sigla, meta }: ITeamLinkCardProps) {
  return (
    <TeamLink to={to}>
      <AvatarGlobal name={name} src={logoUrl} shape="square" />
      <Texts>
        <Name>
          {name}
          {sigla && <BadgeGlobal label={sigla} />}
        </Name>
        {meta && <Meta>{meta}</Meta>}
      </Texts>
    </TeamLink>
  );
}

export type { ITeamLinkCardProps } from './types';
