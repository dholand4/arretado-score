import { Group, GroupName, Groups } from './style';
import type { IGroupsListProps } from './types';

// Grupos de uma fase com os times de cada um, em ordem alfabética.
export function GroupsListGlobal({ grupos }: IGroupsListProps) {
  return (
    <Groups>
      {grupos.map((g) => (
        <Group key={g.id}>
          <GroupName>Grupo {g.nome}</GroupName>
          {g.grupo_times
            .map((gt) => gt.time?.nome ?? '?')
            .sort((a, b) => a.localeCompare(b, 'pt-BR'))
            .join(', ') || 'Sem times'}
        </Group>
      ))}
    </Groups>
  );
}

export type { IGroupsListProps } from './types';
