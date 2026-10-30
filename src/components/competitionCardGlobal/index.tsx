import { AvatarGlobal } from '@/components/avatarGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { MODALIDADE_LABEL, STATUS_COMPETICAO } from '@/constants/competition';
import { CardBox, CardLink, Meta, Name, Texts } from './style';
import type { ICompetitionCardProps } from './types';

export function CompetitionCardGlobal({ nome, modalidade, status, logoUrl, meta, to, inactive = false }: ICompetitionCardProps) {
  const content = (
    <>
      <AvatarGlobal name={nome} src={logoUrl} shape="square" />
      <Texts>
        <Name>{nome}</Name>
        <Meta>
          <span>{MODALIDADE_LABEL[modalidade]}</span>
          {inactive ? (
            <BadgeGlobal label="Desativada" tone="danger" />
          ) : (
            <BadgeGlobal label={STATUS_COMPETICAO[status].label} tone={STATUS_COMPETICAO[status].tone} />
          )}
          {meta && <span>{meta}</span>}
        </Meta>
      </Texts>
    </>
  );
  return to ? (
    <CardLink to={to} $inactive={inactive}>
      {content}
    </CardLink>
  ) : (
    <CardBox $inactive={inactive}>{content}</CardBox>
  );
}

export type { ICompetitionCardProps } from './types';
