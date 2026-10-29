import { ButtonGlobal } from '@/components/buttonGlobal';
import { CardGlobal } from '@/components/cardGlobal';
import { Group, GroupName, Groups, Muted } from './style';
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
      <Groups>
        {phase.grupos.map((g) => (
          <Group key={g.id}>
            <GroupName>Grupo {g.nome}</GroupName>
            {g.grupo_times
              .map((gt) => gt.time?.nome ?? '?')
              .sort((a, b) => a.localeCompare(b, 'pt-BR'))
              .join(', ') || 'Sem times'}
          </Group>
        ))}
      </Groups>
      {blockedReason && <Muted>{blockedReason}</Muted>}
    </CardGlobal>
  );
}

export type { IGroupsCardProps } from './types';
