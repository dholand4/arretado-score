import { BadgeGlobal } from '@/components/badgeGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { FormatSummaryGlobal } from '@/components/formatSummaryGlobal';
import { GroupsListGlobal } from '@/components/groupsListGlobal';
import { STATUS_FASE, TIPO_FASE_LABEL } from '@/constants/phase';
import { Block, PhaseItem, PhaseName, Phases, PhaseType, Subtitle } from './style';
import type { IFormatOverviewProps } from './types';

// Formato da competição para o visitante: fases com status, o caminho até a final
// e os grupos já sorteados.
export function FormatOverviewGlobal({ fases, resumo }: IFormatOverviewProps) {
  const comGrupos = fases.filter((f) => f.tipo === 'grupos' && f.grupos.length > 0);
  return (
    <CardGlobal as="div">
      <Phases>
        {fases.map((f) => (
          <PhaseItem key={f.id}>
            <PhaseName>
              {f.ordem}. {f.nome}
              <PhaseType>{TIPO_FASE_LABEL[f.tipo]}</PhaseType>
            </PhaseName>
            <BadgeGlobal label={STATUS_FASE[f.status].label} tone={STATUS_FASE[f.status].tone} />
          </PhaseItem>
        ))}
      </Phases>
      <Block>
        <Subtitle>Como funciona</Subtitle>
        <FormatSummaryGlobal steps={resumo} />
      </Block>
      {comGrupos.map((f) => (
        <Block key={f.id}>
          <Subtitle>Grupos — {f.nome}</Subtitle>
          <GroupsListGlobal grupos={f.grupos} />
        </Block>
      ))}
    </CardGlobal>
  );
}

export type { IFormatOverviewProps } from './types';
