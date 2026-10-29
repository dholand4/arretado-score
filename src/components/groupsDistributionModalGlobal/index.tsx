import { useId, useState, type FormEvent } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ModalGlobal } from '@/components/modalGlobal';
import { SelectGlobal } from '@/components/selectGlobal';
import { Counts, Form } from './style';
import type { IGroupsDistributionModalProps } from './types';

function initialAssignment({ groupNames, teams, initial }: Pick<IGroupsDistributionModalProps, 'groupNames' | 'teams' | 'initial'>) {
  const byTeam: Record<string, string> = {};
  teams.forEach((team, index) => {
    const fromInitial = Object.entries(initial ?? {}).find(([, ids]) => ids.includes(team.id))?.[0];
    byTeam[team.id] = fromInitial ?? groupNames[index % groupNames.length];
  });
  return byTeam;
}

// Distribuição manual dos times nos grupos (sorteio_grupos = 'manual').
export function GroupsDistributionModalGlobal({
  open,
  groupNames,
  teams,
  initial,
  saving = false,
  error,
  confirmLabel = 'Confirmar grupos',
  onConfirm,
  onClose,
}: IGroupsDistributionModalProps) {
  const formId = useId();
  const [byTeam, setByTeam] = useState(() => initialAssignment({ groupNames, teams, initial }));
  const [localError, setLocalError] = useState<string | null>(null);

  const counts = groupNames.map((name) => ({ name, total: teams.filter((t) => byTeam[t.id] === name).length }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (counts.some((c) => c.total < 2)) {
      setLocalError('Cada grupo precisa de pelo menos 2 times.');
      return;
    }
    setLocalError(null);
    onConfirm(Object.fromEntries(groupNames.map((name) => [name, teams.filter((t) => byTeam[t.id] === name).map((t) => t.id)])));
  };

  return (
    <ModalGlobal
      open={open}
      title="Distribuir times nos grupos"
      onClose={onClose}
      footer={
        <>
          <ButtonGlobal label="Cancelar" variant="ghost" onClick={onClose} disabled={saving} />
          <ButtonGlobal label={confirmLabel} type="submit" form={formId} loading={saving} />
        </>
      }
    >
      <Form id={formId} onSubmit={handleSubmit} noValidate>
        <Counts>{counts.map((c) => `Grupo ${c.name}: ${c.total}`).join(' · ')}</Counts>
        {teams.map((team) => (
          <SelectGlobal
            key={team.id}
            label={team.nome}
            value={byTeam[team.id]}
            options={groupNames.map((name) => ({ value: name, label: `Grupo ${name}` }))}
            onChange={(e) => setByTeam((current) => ({ ...current, [team.id]: e.target.value }))}
          />
        ))}
        {(localError || error) && <AlertGlobal variant="error" message={localError ?? error ?? ''} />}
      </Form>
    </ModalGlobal>
  );
}

export type { IGroupsDistributionModalProps } from './types';
