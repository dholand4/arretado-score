import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertGlobal } from '@/components/alertGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { ConfirmDialogGlobal } from '@/components/confirmDialogGlobal';
import { EntityHeaderGlobal } from '@/components/entityHeaderGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LinkButtonGlobal } from '@/components/linkButtonGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PlayerFormModalGlobal } from '@/components/playerFormModalGlobal';
import { RosterGlobal } from '@/components/rosterGlobal';
import { TeamFormModalGlobal } from '@/components/teamFormModalGlobal';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useDonos } from '@/hooks/useCompetitionAdmins';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useTeamRoster } from '@/hooks/useTeamRoster';
import { useTeam, useTeams } from '@/hooks/useTeams';
import { useConfirmAction } from '@/hooks/useConfirm';
import { paths, type ITeamRouteState } from '@/routes/types';
import type { ITimeDetalhe } from '@/@types/competition';
import { getErrorMessage } from '@/utils/appError';
import { Feedback } from './style';
import { formatPhone } from '@/utils/phone';

function TeamRoster({ team }: { team: ITimeDetalhe }) {
  const roster = useTeamRoster(team, true);
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
      {roster.deleteProps && <ConfirmDialogGlobal {...roster.deleteProps} />}
    </>
  );
}

export function TeamDetailScreen() {
  const { competitionId, teamId } = useRouteParams('competitionId', 'teamId');
  // Aberto pela etapa Times da configuração: voltar (e excluir) leva de volta para lá.
  const fromSettings = (useLocation().state as ITeamRouteState | null)?.origem === 'configuracao';
  const back = fromSettings
    ? { to: paths.competitionSettings(competitionId, 'times'), label: 'Configuração' }
    : { to: paths.competitionTeams(competitionId), label: 'Times' };
  useBackNavigation(back);
  const navigate = useAppNavigate();
  const { team, isLoading, error, refetch, updateTeam } = useTeam(teamId);
  const { removeTeam } = useTeams(competitionId);
  const [modal, setModal] = useState<'edit' | 'delete' | null>(null);
  const { donos } = useDonos(modal === 'edit');
  const confirmAction = useConfirmAction();

  if (isLoading) return <LoaderGlobal label="Carregando time" />;
  if (error || !team) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;

  const open = (next: 'edit' | 'delete') => {
    updateTeam.reset();
    removeTeam.reset();
    setModal(next);
  };

  return (
    <>
      <EntityHeaderGlobal
        title={team.nome}
        subtitle={team.dono ? `Responsável: ${team.dono.nome}${team.dono.telefone ? ` · ${formatPhone(team.dono.telefone)}` : ''}` : 'Sem responsável'}
        imageUrl={team.logo_url}
        badges={team.sigla ? <BadgeGlobal label={team.sigla} /> : undefined}
        actions={
          <>
            <LinkButtonGlobal to={back.to} label={`← ${back.label}`} size="sm" variant="ghost" hideOnMobile />
            <ButtonGlobal label="Editar time" size="sm" variant="outline" onClick={() => open('edit')} />
            <ButtonGlobal label="Excluir time" size="sm" variant="ghost" onClick={() => open('delete')} />
          </>
        }
      />
      <TeamRoster team={team} />

      {modal === 'edit' && (
        <TeamFormModalGlobal
          open
          initialValues={{ nome: team.nome, sigla: team.sigla ?? '', dono_id: team.dono_id, logo_url: team.logo_url }}
          donos={
            team.dono && !donos.some((d) => d.id === team.dono_id)
              ? [...donos, { id: team.dono_id as string, nome: team.dono.nome, telefone: team.dono.telefone }]
              : donos
          }
          saving={updateTeam.isPending}
          error={updateTeam.error ? getErrorMessage(updateTeam.error) : null}
          onSubmit={(patch, logo, novoDono, contato) =>
            confirmAction(
              novoDono ? `Salvar o time e criar o acesso ${novoDono.email}?` : 'Salvar as alterações do time?',
              () => updateTeam.mutate({ patch, logo, novoDono, contato }, { onSuccess: () => setModal(null) }),
            )
          }
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'delete' && (
        <ConfirmDialogGlobal
          open
          title="Excluir time"
          message={`Excluir ${team.nome} e todo o elenco? Isso não pode ser desfeito.`}
          confirmLabel="Excluir"
          danger
          loading={removeTeam.isPending}
          error={removeTeam.error ? getErrorMessage(removeTeam.error) : null}
          onConfirm={() =>
            removeTeam.mutate(team.id, {
              onSuccess: () => navigate(back.to, { replace: true }),
            })
          }
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
