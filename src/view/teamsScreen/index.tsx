import { useState } from 'react';
import { AlertGlobal } from '@/components/alertGlobal';
import { AvatarGlobal } from '@/components/avatarGlobal';
import { BadgeGlobal } from '@/components/badgeGlobal';
import { ButtonGlobal } from '@/components/buttonGlobal';
import { EmptyStateGlobal } from '@/components/emptyStateGlobal';
import { ErrorStateGlobal } from '@/components/errorStateGlobal';
import { LoaderGlobal } from '@/components/loaderGlobal';
import { PageHeaderGlobal } from '@/components/pageHeaderGlobal';
import { TeamFormModalGlobal } from '@/components/teamFormModalGlobal';
import { useDonos } from '@/hooks/useCompetitionAdmins';
import { useRouteParams } from '@/hooks/useRouteParams';
import { useTeams } from '@/hooks/useTeams';
import { paths } from '@/routes/types';
import { getErrorMessage } from '@/utils/appError';
import { pluralize } from '@/utils/text';
import { Feedback, List, Meta, Name, TeamLink, Texts } from './style';

export function TeamsScreen() {
  const { competitionId } = useRouteParams('competitionId');
  const { teams, isLoading, error, refetch, createTeam } = useTeams(competitionId);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const { donos } = useDonos(creating);

  const openCreate = () => {
    createTeam.reset();
    setCreating(true);
  };

  const renderContent = () => {
    if (isLoading) return <LoaderGlobal label="Carregando times" />;
    if (error) return <ErrorStateGlobal error={error} onRetry={() => void refetch()} />;
    if (teams.length === 0) {
      return (
        <EmptyStateGlobal
          title="Nenhum time cadastrado"
          description="Cadastre os times; depois, entre em cada um para montar o elenco."
          action={<ButtonGlobal label="Novo time" onClick={openCreate} />}
        />
      );
    }
    return (
      <List aria-label="Times">
        {teams.map((team) => (
          <li key={team.id}>
            <TeamLink to={paths.competitionTeam(competitionId, team.id)}>
              <AvatarGlobal name={team.nome} src={team.logo_url} shape="square" />
              <Texts>
                <Name>
                  {team.nome}
                  {team.sigla && <BadgeGlobal label={team.sigla} />}
                </Name>
                <Meta>
                  {pluralize(team.jogadores[0]?.count ?? 0, 'jogador', 'jogadores')} ·{' '}
                  {team.dono ? `Dono: ${team.dono.nome}` : 'Sem dono vinculado'}
                </Meta>
              </Texts>
            </TeamLink>
          </li>
        ))}
      </List>
    );
  };

  return (
    <>
      <PageHeaderGlobal
        title="Times"
        subtitle="Cadastre times, vincule o dono e monte os elencos."
        actions={teams.length > 0 && <ButtonGlobal label="Novo time" onClick={openCreate} />}
      />
      {created && (
        <Feedback>
          <AlertGlobal variant="success" message={`Time ${created} cadastrado.`} onClose={() => setCreated(null)} />
        </Feedback>
      )}
      {renderContent()}
      {creating && (
        <TeamFormModalGlobal
          open
          donos={donos}
          saving={createTeam.isPending}
          error={createTeam.error ? getErrorMessage(createTeam.error) : null}
          onSubmit={(input, logo) =>
            createTeam.mutate(
              { input, logo },
              {
                onSuccess: (team) => {
                  setCreating(false);
                  setCreated(team.nome);
                },
              },
            )
          }
          onClose={() => setCreating(false)}
        />
      )}
    </>
  );
}
