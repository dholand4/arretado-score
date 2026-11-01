import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { GroupsListGlobal } from '@/components/groupsListGlobal';
import { Muted } from './style';
import type { IGroupsCardProps } from './types';

// Grupos da fase em andamento, com "sortear de novo" enquanto nenhum jogo tiver súmula.
export function GroupsCardGlobal({ phase, blockedReason, busy = false, onRedraw }: IGroupsCardProps) {
  const manual = phase.sorteio_grupos === 'manual';
  return (
    <CardGlobal
      title={`Grupos — ${phase.nome}`}
      actions={
        <ButtonGlobal
          label={manual ? 'Redistribuir' : 'Sortear de novo'}
          size="sm"
          variant="outline"
          loading={busy}
          disabled={Boolean(blockedReason)}
          onClick={onRedraw}
        />
      }
    >
      <GroupsListGlobal grupos={phase.grupos} />
      {blockedReason && <Muted>{blockedReason}</Muted>}
    </CardGlobal>
  );
}

export type { IGroupsCardProps } from './types';
