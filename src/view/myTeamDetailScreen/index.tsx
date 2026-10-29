import { useState } from 'react';
import type { ITimeDetalhe } from '@/@types/competition';
import { AlertGlobal } from '@/components/alertGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { EntityHeaderGlobal } from '@/components/entityHeaderGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PlayerFormModalGlobal } from '@/components/playerFormModalGlobal';
import { RosterGlobal } from '@/components/rosterGlobal';
import { TeamFormModalGlobal } from '@/components/teamFormModalGlobal';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useTeamRoster } from '@/hooks/useTeamRoster';
import { useTeam } from '@/hooks/useTeams';
import { ROUTES } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { Feedback } from './style';

function OwnerRoster({ team }: { team: ITimeDetalhe }) {
  const roster = useTeamRoster(team, false);
  if (roster.isLoading) return <LoaderGlobal label="Carregando elenco" />;
  if (roster.error) return <ErrorStateGlobal error={roster.error} onRetry={() => void roster.refetch()} />;
  return (
    <>
      {roster.actionError && (
        <Feedback>
          <AlertGlobal variant="error" message={roster.actionError} />
        </Feedback>
      )}
      <RosterGlobal {...roster.rosterProps} />
      {roster.formProps && <PlayerFormModalGlobal key={roster.formKey} {...roster.formProps} />}
    </>
  );
}

export function MyTeamDetailScreen() {
  const { teamId } = useRouteParams('teamId');
  const { team, isLoading, error, refetch, updateTeam } = useTeam(teamId);
  const [editing, setEditing] = useState(false);

  if (isLoading) return <LoaderGlobal label="Carregando time" />;
  if (error || !team) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  return (
    <>
      <EntityHeaderGlobal
        title={team.nome}
        subtitle={team.competicao.nome}
        imageUrl={team.logo_url}
        badges={team.sigla ? <BadgeGlobal label={team.sigla} /> : undefined}
        actions={
          <>
            <LinkButtonGlobal to={ROUTES.myTeams} label="← Meus times" size="sm" variant="ghost" />
            <ButtonGlobal
              label="Editar nome e logo"
              size="sm"
              variant="outline"
              onClick={() => {
                updateTeam.reset();
                setEditing(true);
              }}
            />
          </>
        }
      />
      <OwnerRoster team={team} />
      {editing && (
        <TeamFormModalGlobal
          open
          ownerMode
          initialValues={{ nome: team.nome, sigla: team.sigla ?? '', dono_id: team.dono_id, logo_url: team.logo_url }}
          saving={updateTeam.isPending}
          error={updateTeam.error ? getErrorMessage(updateTeam.error) : null}
          onSubmit={(values, logo) =>
            updateTeam.mutate({ patch: { nome: values.nome }, logo }, { onSuccess: () => setEditing(false) })
          }
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
