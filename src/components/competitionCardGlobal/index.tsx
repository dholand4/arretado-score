import { AvatarGlobal } from '@/components/avatarGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { MODALIDADE_LABEL, STATUS_COMPETICAO } from '@/constants/competition';
import { CardBox, CardLink, Meta, Name, Texts } from './style';
import type { ICompetitionCardProps } from './types';

export function CompetitionCardGlobal({ nome, modalidade, status, logoUrl, meta, to }: ICompetitionCardProps) {
  const content = (
    <>
      <AvatarGlobal name={nome} src={logoUrl} shape="square" />
      <Texts>
        <Name>{nome}</Name>
        <Meta>
          <span>{MODALIDADE_LABEL[modalidade]}</span>
          <BadgeGlobal label={STATUS_COMPETICAO[status].label} tone={STATUS_COMPETICAO[status].tone} />
          {meta && <span>{meta}</span>}
        </Meta>
      </Texts>
    </>
  );
  return to ? <CardLink to={to}>{content}</CardLink> : <CardBox>{content}</CardBox>;
}

export type { ICompetitionCardProps } from './types';
